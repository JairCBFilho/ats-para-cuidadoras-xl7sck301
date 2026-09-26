// Valida se um token de convite existe, nao foi usado e nao expirou.
// GET /backend/v1/convites/validar?token=...
// Publico (sem auth) — retorna apenas valid + email + role
routerAdd('GET', '/backend/v1/convites/validar', (e) => {
  var q = e.requestInfo().query || {}
  var token = String(q.token || '').trim()
  if (!token) return e.json(200, { valid: false })

  var recs = $app.findRecordsByFilter('convites', 'token = {:t}', 'created', 1, 0, { t: token })
  if (recs.length === 0) return e.json(200, { valid: false })

  var rec = recs[0]
  if (rec.getBool('usado')) return e.json(200, { valid: false })

  var exp = new Date(rec.getString('expires_at'))
  if (exp.getTime() < Date.now()) return e.json(200, { valid: false })

  return e.json(200, { valid: true, email: rec.getString('email'), role: rec.getString('role') })
})
