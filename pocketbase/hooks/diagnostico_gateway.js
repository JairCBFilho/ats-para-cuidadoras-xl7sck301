/// <reference path="../pb_hooks/types.d.ts" />

// Endpoint de diagnóstico temporário para o gateway de IA.
// Retorna o valor de SKIP_AI_GATEWAY_URL e os primeiros 8 caracteres
// de SKIP_AI_GATEWAY_API_KEY (prefixo), para confirmar que as variáveis
// de ambiente estão acessíveis aos hooks.
routerAdd('GET', '/v1/diagnostico-gateway', (e) => {
  const url = $os.getenv('SKIP_AI_GATEWAY_URL') || ''
  const apiKey = $os.getenv('SKIP_AI_GATEWAY_API_KEY') || ''

  const apiKeyPrefix = apiKey.length > 0 ? apiKey.substring(0, 8) : ''

  console.log('[diagnostico-gateway] SKIP_AI_GATEWAY_URL =', JSON.stringify(url))
  console.log(
    '[diagnostico-gateway] SKIP_AI_GATEWAY_API_KEY prefix =',
    JSON.stringify(apiKeyPrefix),
  )

  return e.json(200, {
    url: url,
    api_key_prefix: apiKeyPrefix,
    status: 'ok',
  })
})
