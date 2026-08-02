onRecordAfterUpdateSuccess((e) => {
  var oldEtapa = e.record.original().getString('etapa')
  var newEtapa = e.record.getString('etapa')
  if (oldEtapa === newEtapa) return e.next()

  var candidataId = e.record.getString('candidata')
  if (!candidataId) return e.next()

  var candidata
  try {
    candidata = $app.findRecordById('candidatas', candidataId)
  } catch (err) {
    $app
      .logger()
      .error('candidata not found', 'applicationId', e.record.id, 'candidataId', candidataId)
    return e.next()
  }

  var email = candidata.getString('email')
  var nome = candidata.getString('nome')
  if (!email) {
    $app.logger().warn('candidata has no email', 'candidataId', candidataId)
    return e.next()
  }

  var vagaId = e.record.getString('vaga')
  var cargo = ''
  try {
    var vaga = $app.findRecordById('vagas', vagaId)
    cargo = vaga.getString('cargo')
  } catch (_) {}

  var dataEntrevista = 'data a confirmar'
  try {
    var ents = $app.findRecordsByFilter(
      'entrevistas',
      "candidata = '" + candidataId + "' && vaga = '" + vagaId + "' && status = 'agendada'",
      'data_hora',
      1,
      0,
    )
    if (ents.length > 0) {
      var rawDate = ents[0].getString('data_hora')
      var d = new Date(rawDate)
      var pDay = d.getDate() < 10 ? '0' + d.getDate() : '' + d.getDate()
      var pMonth = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : '' + (d.getMonth() + 1)
      var pHour = d.getHours() < 10 ? '0' + d.getHours() : '' + d.getHours()
      var pMin = d.getMinutes() < 10 ? '0' + d.getMinutes() : '' + d.getMinutes()
      dataEntrevista = pDay + '/' + pMonth + '/' + d.getFullYear() + ' ' + pHour + ':' + pMin
    }
  } catch (_) {}

  var assunto = '',
    corpo = ''
  var template = null
  try {
    var templates = $app.findRecordsByFilter(
      'email_templates',
      "etapa = '" + newEtapa + "' && canal = 'email'",
      'created',
      1,
      0,
    )
    if (templates.length > 0) template = templates[0]
  } catch (_) {}

  if (template) {
    assunto = template.getString('assunto')
    corpo = template.getString('corpo')
  } else {
    var defaults = {
      Triagem: {
        assunto: 'CuidarATS - Sua candidatura esta em triagem',
        corpo:
          '<h2>Ola, ' +
          nome +
          '!</h2><p>Sua candidatura foi atualizada para <strong>Triagem</strong>.</p><p>Em breve entraremos em contato.</p><p>Equipe CuidarATS</p>',
      },
      Entrevista: {
        assunto: 'CuidarATS - Voce foi convocada para entrevista!',
        corpo:
          '<h2>Ola, ' +
          nome +
          '!</h2><p>Parabens! Sua candidatura avancou para <strong>Entrevista</strong>.</p><p>Entraremos em contato para agendar.</p><p>Equipe CuidarATS</p>',
      },
      Aprovada: {
        assunto: 'CuidarATS - Parabens, voce foi aprovada!',
        corpo:
          '<h2>Ola, ' +
          nome +
          '!</h2><p>Voce foi <strong>aprovada</strong>!</p><p>Em breve entraremos em contato.</p><p>Equipe CuidarATS</p>',
      },
      Rejeitada: {
        assunto: 'CuidarATS - Atualizacao sobre sua candidatura',
        corpo:
          '<h2>Ola, ' +
          nome +
          '.</h2><p>Agradecemos o seu interesse. Infelizmente nao foi possivel dar continuidade.</p><p>Equipe CuidarATS</p>',
      },
    }
    var def = defaults[newEtapa]
    if (!def) return e.next()
    assunto = def.assunto
    corpo = def.corpo
  }

  assunto = assunto
    .replace(/{nome_candidata}/g, nome)
    .replace(/{cargo}/g, cargo)
    .replace(/{etapa}/g, newEtapa)
    .replace(/{nome_vaga}/g, cargo)
    .replace(/{data_entrevista}/g, dataEntrevista)
  corpo = corpo
    .replace(/{nome_candidata}/g, nome)
    .replace(/{cargo}/g, cargo)
    .replace(/{etapa}/g, newEtapa)
    .replace(/{nome_vaga}/g, cargo)
    .replace(/{data_entrevista}/g, dataEntrevista)

  try {
    var client = $app.newMailClient()
    client.send({
      from: { name: 'CuidarATS', address: 'noreply@cuidarats.com' },
      to: [{ name: nome, address: email }],
      subject: assunto,
      html: corpo,
    })
    $app
      .logger()
      .info('stage-change email sent', 'to', email, 'etapa', newEtapa, 'applicationId', e.record.id)
  } catch (err) {
    $app.logger().error('failed to send email', 'error', String(err), 'to', email)
  }
  return e.next()
}, 'applications')
