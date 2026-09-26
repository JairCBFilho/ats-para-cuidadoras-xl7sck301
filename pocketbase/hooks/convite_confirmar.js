// Confirma um convite: cria o usuario e marca o convite como usado.
// POST /backend/v1/convites/confirmar
// Body: { token, name, password }
// Publico (sem auth) — o token e a senha
routerAdd('POST', '/backend/v1/convites/confirmar', (e) => {
  var body = e.requestInfo().body || {}
  var token = String(body.token || '').trim()
  var name = String(body.name || '').trim()
  var password = String(body.password || '')

  if (!token) return e.badRequestError('Token obrigatorio')
  if (!name) return e.badRequestError('Nome obrigatorio')
  if (password.length < 8) return e.badRequestError('Senha deve ter no minimo 8 caracteres')

  var recs = $app.findRecordsByFilter('convites', 'token = {:t}', 'created', 1, 0, { t: token })
  if (recs.length === 0) return e.badRequestError('Convite invalido ou expirado')

  var inv = recs[0]
  if (inv.getBool('usado')) return e.badRequestError('Convite ja utilizado')

  var exp = new Date(inv.getString('expires_at'))
  if (exp.getTime() < Date.now()) return e.badRequestError('Convite expirado')

  var email = inv.getString('email')

  // Dupla checagem: ja existe usuario com este e-mail?
  try {
    $app.findAuthRecordByEmail('_pb_users_auth_', email)
    return e.badRequestError('Ja existe usuario com este e-mail')
  } catch (_) {
    /* ok — segue */
  }

  var usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
  var user = new Record(usersCol)
  user.setEmail(email)
  user.setPassword(password)
  user.setVerified(true)
  user.set('name', name)
  user.set('role', inv.getString('role'))

  try {
    $app.save(user)
  } catch (err) {
    $app.logger().error('convite-confirmar save failed', 'error', String(err))
    return e.badRequestError('Nao foi possivel criar a conta. Verifique os dados.')
  }

  inv.set('usado', true)
  try {
    $app.save(inv)
  } catch (_) {
    /* erro nao critico — o convite ja foi usado */
  }

  return e.json(200, { success: true, email: email })
})
