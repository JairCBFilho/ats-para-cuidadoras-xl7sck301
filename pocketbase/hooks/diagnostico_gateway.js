// Endpoint de diagnóstico do gateway de IA.
//
// Acionado manualmente via GET /backend/v1/diagnostico-gateway
// (também disponível em /v1/diagnostico-gateway como fallback).
// Lê SKIP_AI_GATEWAY_URL e SKIP_AI_GATEWAY_API_KEY com $os.getenv(),
// registra os valores (com a API key mascarada) via console.log e os
// devolve como JSON na resposta, também parcialmente mascarados.
//
// Toda a lógica fica inline dentro de cada callback — o JSVM do
// PocketBase executa os handlers em um VM separado do registro, então
// variáveis/funções declaradas no topo do arquivo não são acessíveis
// em runtime. A lógica é duplicada em cada rota (padrão recomendado).
routerAdd('GET', '/backend/v1/diagnostico-gateway', (e) => {
  var url = $os.getenv('SKIP_AI_GATEWAY_URL') || ''
  var apiKey = $os.getenv('SKIP_AI_GATEWAY_API_KEY') || ''

  var maskedKey = ''
  if (apiKey) {
    if (apiKey.length <= 8) {
      maskedKey = '****'
    } else {
      maskedKey = apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4)
    }
  }

  console.log('[diagnostico-gateway] SKIP_AI_GATEWAY_URL =', JSON.stringify(url))
  console.log(
    '[diagnostico-gateway] SKIP_AI_GATEWAY_API_KEY (mascarada) =',
    JSON.stringify(maskedKey),
  )
  console.log('[diagnostico-gateway] SKIP_AI_GATEWAY_API_KEY definida =', apiKey.length > 0)

  return e.json(200, {
    status: 'ok',
    skip_ai_gateway_url: url,
    skip_ai_gateway_api_key_masked: maskedKey,
    skip_ai_gateway_api_key_set: apiKey.length > 0,
  })
})

routerAdd('GET', '/v1/diagnostico-gateway', (e) => {
  var url = $os.getenv('SKIP_AI_GATEWAY_URL') || ''
  var apiKey = $os.getenv('SKIP_AI_GATEWAY_API_KEY') || ''

  var maskedKey = ''
  if (apiKey) {
    if (apiKey.length <= 8) {
      maskedKey = '****'
    } else {
      maskedKey = apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4)
    }
  }

  console.log('[diagnostico-gateway] SKIP_AI_GATEWAY_URL =', JSON.stringify(url))
  console.log(
    '[diagnostico-gateway] SKIP_AI_GATEWAY_API_KEY (mascarada) =',
    JSON.stringify(maskedKey),
  )
  console.log('[diagnostico-gateway] SKIP_AI_GATEWAY_API_KEY definida =', apiKey.length > 0)

  return e.json(200, {
    status: 'ok',
    skip_ai_gateway_url: url,
    skip_ai_gateway_api_key_masked: maskedKey,
    skip_ai_gateway_api_key_set: apiKey.length > 0,
  })
})
