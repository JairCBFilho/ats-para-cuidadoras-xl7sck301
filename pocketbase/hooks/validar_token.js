// Valida se o token de cadastro publico de cuidadoras existe e coincide com o registrado em `configuracoes`.
// GET /backend/v1/validar-token?token=...
// Publico (sem auth) — retorna { valid: boolean }
routerAdd('GET', '/backend/v1/validar-token', (e) => {
  var q = e.requestInfo().query || {}
  var token = String(q.token || '').trim()
  if (!token) {
    return e.json(200, { valid: false })
  }

  var expectedToken = ''
  try {
    var configs = $app.findRecordsByFilter('configuracoes', "id != ''", 'created', 1, 0)
    if (configs.length > 0) {
      expectedToken = String(configs[0].getString('token_cadastro') || '').trim()
    }
  } catch (_) {
    expectedToken = ''
  }

  if (!expectedToken || token !== expectedToken) {
    return e.json(200, { valid: false })
  }

  return e.json(200, { valid: true })
})
