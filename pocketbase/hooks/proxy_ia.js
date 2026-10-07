// Proxy publico para o Skip AI Gateway, usado pelo projeto GestaoPsi (Supabase).
//
// POST /backend/v1/proxy-ia
// Header: x-api-key: <PROXY_IA_API_KEY>
// Body:   { "agent": "triagem-ia", "messages": [...], "tier": "fast" }
//
// Como o Supabase nao consegue alcancar o endpoint interno do gateway
// (https://skip-ai-gateway.internal.goskip.dev/v1), o Lazuli atua como proxy,
// chamando $ai.agent(agent).chat(messages, { tier }) e devolvendo o resultado.
//
// Padrao de codificacao (mesmo do diagnostico_gateway.js):
// - Toda a logica inline dentro do callback do routerAdd (o JSVM executa
//   os handlers em uma VM separada do registro, entao declaracoes de topo
//   nao sao acessiveis em runtime).
// - Usar var (nao const/let) e function nomeadas quando necessario.
// - Nao referenciar nada declarado fora do callback.
routerAdd('POST', '/backend/v1/proxy-ia', (e) => {
  // --- Autenticacao via x-api-key ---
  var apiKey = $os.getenv('PROXY_IA_API_KEY') || ''
  if (!apiKey) {
    console.log('[proxy-ia] ERRO: secret PROXY_IA_API_KEY nao definida no ambiente')
    return e.json(500, {
      error: 'Erro ao processar a requisicao de IA',
      details: 'Secret de autenticacao nao configurada',
    })
  }

  var requestInfo = e.requestInfo()
  var headers = requestInfo.headers || {}
  var sentKey = headers['x-api-key'] || headers['X-Api-Key'] || ''

  if (!sentKey || sentKey !== apiKey) {
    console.log('[proxy-ia] NAO AUTORIZADO: x-api-key ausente ou invalida')
    return e.json(401, { error: 'Nao autorizado' })
  }

  // --- Rate limiting via $app.store() por IP (30 reqs/minuto) ---
  var ip = e.realIP() || 'unknown'
  var rlKey = 'proxy_ia_rl:' + ip
  var store = $app.store()
  var now = Date.now()
  var windowMs = 60 * 1000
  var maxReqs = 30
  var entry = null
  try {
    entry = store.get(rlKey)
  } catch (_) {
    entry = null
  }
  if (!entry || typeof entry !== 'object') {
    entry = { count: 0, first: now }
  }
  if (now - entry.first > windowMs) {
    entry = { count: 0, first: now }
  }
  entry.count = entry.count + 1
  store.set(rlKey, entry)
  if (entry.count > maxReqs) {
    console.log('[proxy-ia] RATE LIMIT EXCEDIDO: ip=' + ip + ' count=' + entry.count)
    return e.json(429, {
      error:
        'Muitas requisições ao proxy de IA. Limite de 30 req/min excedido. Tente novamente em instantes.',
    })
  }

  // --- Parse e validacao do body ---
  var body = requestInfo.body || {}
  var agent = body.agent
  var messages = body.messages
  var tier = body.tier || 'fast'

  if (!agent || typeof agent !== 'string' || agent.trim() === '') {
    console.log('[proxy-ia] BAD REQUEST: campo "agent" ausente ou invalido')
    return e.json(400, { error: 'Campo "agent" e obrigatorio e deve ser uma string nao vazia' })
  }

  if (!messages) {
    console.log('[proxy-ia] BAD REQUEST: campo "messages" ausente')
    return e.json(400, { error: 'Campo "messages" e obrigatorio' })
  }

  var msgCount = 0
  if (Array.isArray(messages)) {
    msgCount = messages.length
  } else if (typeof messages === 'object') {
    // Permite o formato { user_id, message } usado pelos outros hooks do projeto.
    msgCount = 1
  } else {
    console.log('[proxy-ia] BAD REQUEST: campo "messages" com formato invalido')
    return e.json(400, {
      error: 'Campo "messages" deve ser um array de mensagens ou um objeto de mensagem',
    })
  }

  console.log(
    '[proxy-ia] chamada -> agente=' +
      JSON.stringify(agent) +
      ' tier=' +
      JSON.stringify(tier) +
      ' mensagens=' +
      msgCount,
  )

  // --- Chamada ao agente de IA ---
  try {
    var result = $ai.agent(agent).chat(messages, { tier: tier || 'fast' })
    console.log(
      '[proxy-ia] SUCESSO -> agente=' + JSON.stringify(agent) + ' tier=' + JSON.stringify(tier),
    )
    return e.json(200, result)
  } catch (err) {
    var errMsg = err && err.message ? err.message : String(err)
    console.log(
      '[proxy-ia] ERRO -> agente=' +
        JSON.stringify(agent) +
        ' tier=' +
        JSON.stringify(tier) +
        ' erro=' +
        JSON.stringify(errMsg),
    )
    return e.json(500, { error: 'Erro ao processar a requisicao de IA', details: errMsg })
  }
})
