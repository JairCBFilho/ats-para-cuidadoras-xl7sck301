// Cria um convite de acesso e envia e-mail com link.
// POST /backend/v1/convites/criar
// Body: { email, role }
// Auth: qualquer usuario autenticado pode convidar
routerAdd('POST', '/backend/v1/convites/criar', (e) => {
  var userId = e.auth ? e.auth.id : ''
  if (!userId) return e.unauthorizedError('Autenticacao necessaria')

  var body = e.requestInfo().body || {}
  var email = String(body.email || '')
    .trim()
    .toLowerCase()
  var role = String(body.role || 'recrutador').trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return e.badRequestError('E-mail invalido')
  if (role !== 'admin' && role !== 'recrutador') role = 'recrutador'

  // Verifica se ja existe usuario com este e-mail
  try {
    $app.findAuthRecordByEmail('_pb_users_auth_', email)
    return e.badRequestError('Ja existe um usuario com este e-mail')
  } catch (_) {
    /* nao existe — segue */
  }

  var token = 'inv_' + $security.randomString(32)
  var expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  var col = $app.findCollectionByNameOrId('convites')
  var rec = new Record(col)
  rec.set('email', email)
  rec.set('token', token)
  rec.set('role', role)
  rec.set('usado', false)
  rec.set('expires_at', expires.toISOString().replace('T', ' ') + 'Z')
  try {
    $app.save(rec)
  } catch (err) {
    $app.logger().error('convite-criar save failed', 'error', String(err))
    return e.json(500, { error: 'Erro ao criar convite' })
  }

  // Monta o link a partir do Host header
  var link = ''
  try {
    var hs = e.requestInfo().headers || {}
    var host = String(hs.host || hs.Host || '')
    if (host.indexOf(',') !== -1) host = host.split(',')[0].trim()
    if (host) link = 'https://' + host + '/signup?token=' + token
  } catch (_) {
    /* sem host — link vazio */
  }

  // Tenta enviar e-mail
  if (link) {
    try {
      var client = $app.newMailClient()
      client.send({
        from: { name: 'Lazuli ATS', address: 'noreply@lazuliats.com' },
        to: [{ name: email, address: email }],
        subject: 'Convite — Lazuli ATS',
        html:
          '<h2>Ola!</h2><p>Voce foi convidado(a) para acessar o Lazuli ATS.</p><p>Crie sua conta no link abaixo (valido por 7 dias):</p><p><a href="' +
          link +
          '">' +
          link +
          '</a></p><p>Equipe Lazuli ATS</p>',
      })
    } catch (err) {
      $app.logger().error('convite-criar email failed', 'error', String(err))
      // Falha no email nao impede o convite — admin copia o link manualmente
    }
  }

  return e.json(200, { token: token, link: link, expires_at: expires.toISOString() })
})
