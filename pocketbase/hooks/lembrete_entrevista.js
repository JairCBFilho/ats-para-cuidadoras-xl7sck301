// Lembretes automáticos de entrevista (24h antes).
// Cron horário: encontra candidatas na etapa "Entrevista" cuja entrevista agendada
// (entrevistas.data_hora) ocorre entre (agora + 23h) e (agora + 25h), que ainda NÃO
// receberam lembrete (applications.lembrete_enviado != true), envia e-mail usando o
// template "LembreteEntrevista" e marca lembrete_enviado = true.
cronAdd('lembrete_entrevista_check', '0 * * * *', () => {
  var now = new Date()
  var start = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  var end = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // Candidatas na etapa Entrevista sem lembrete enviado.
  var apps = $app.findRecordsByFilter(
    'applications',
    "etapa = 'Entrevista' && lembrete_enviado != true",
    'created',
    500,
    0,
  )

  // Carrega o template de lembrete (canal email).
  var template = null
  try {
    var tpls = $app.findRecordsByFilter(
      'email_templates',
      "etapa = 'LembreteEntrevista' && canal = 'email'",
      'created',
      1,
      0,
    )
    if (tpls.length > 0) template = tpls[0]
  } catch (_) {}

  for (var i = 0; i < apps.length; i++) {
    var appRec = apps[i]
    var candidataId = appRec.getString('candidata')
    var vagaId = appRec.getString('vaga')

    // Busca entrevista agendada para esta candidata+vaga dentro da janela.
    var ents = []
    try {
      ents = $app.findRecordsByFilter(
        'entrevistas',
        "candidata = '" + candidataId + "' && vaga = '" + vagaId + "' && status = 'agendada'",
        'data_hora',
        5,
        0,
      )
    } catch (_) {}

    if (ents.length === 0) continue

    var dentroJanela = false
    var dataHora = null
    for (var j = 0; j < ents.length; j++) {
      var d = new Date(ents[j].getString('data_hora'))
      if (d >= start && d <= end) {
        dentroJanela = true
        dataHora = d
        break
      }
    }
    if (!dentroJanela) continue

    // Dados da candidata e da vaga.
    var nome = ''
    var email = ''
    try {
      var candidata = $app.findRecordById('candidatas', candidataId)
      nome = candidata.getString('nome')
      email = candidata.getString('email')
    } catch (err) {
      $app.logger().error('lembrete: candidata nao encontrada', 'id', candidataId)
      continue
    }
    if (!email) continue

    var cargo = ''
    try {
      var vaga = $app.findRecordById('vagas', vagaId)
      cargo = vaga.getString('cargo')
    } catch (_) {}

    // Formata data/hora (dd/mm/aaaa HH:MM).
    var pDay = dataHora.getDate() < 10 ? '0' + dataHora.getDate() : '' + dataHora.getDate()
    var pMonth =
      dataHora.getMonth() + 1 < 10
        ? '0' + (dataHora.getMonth() + 1)
        : '' + (dataHora.getMonth() + 1)
    var pHour = dataHora.getHours() < 10 ? '0' + dataHora.getHours() : '' + dataHora.getHours()
    var pMin = dataHora.getMinutes() < 10 ? '0' + dataHora.getMinutes() : '' + dataHora.getMinutes()
    var dataStr = pDay + '/' + pMonth + '/' + dataHora.getFullYear() + ' ' + pHour + ':' + pMin

    var assunto = 'Lembrete: sua entrevista sera amanha'
    var corpo =
      '<h2>Ola, ' +
      nome +
      '!</h2>' +
      '<p>Este e um lembrete da sua entrevista para a vaga de <strong>' +
      cargo +
      '</strong>.</p>' +
      '<p><strong>Data e hora:</strong> ' +
      dataStr +
      '</p>' +
      '<p>Por favor, confirme sua presenca. Em caso de imprevisto, responda este e-mail.</p>' +
      '<p>Ate logo!<br>Equipe Lazuli ATS</p>'

    if (template) {
      assunto = String(template.getString('assunto') || assunto)
      corpo = String(template.getString('corpo') || corpo)
      assunto = assunto
        .replace(/{nome_candidata}/g, nome)
        .replace(/{nome_vaga}/g, cargo)
        .replace(/{cargo}/g, cargo)
        .replace(/{data_entrevista}/g, dataStr)
      corpo = corpo
        .replace(/{nome_candidata}/g, nome)
        .replace(/{nome_vaga}/g, cargo)
        .replace(/{cargo}/g, cargo)
        .replace(/{data_entrevista}/g, dataStr)
    }

    try {
      var client = $app.newMailClient()
      client.send({
        from: { name: 'Lazuli ATS', address: 'noreply@lazuliats.com' },
        to: [{ name: nome, address: email }],
        subject: assunto,
        html: corpo,
      })
      appRec.set('lembrete_enviado', true)
      $app.save(appRec)
      $app.logger().info('lembrete entrevista enviado', 'to', email, 'applicationId', appRec.id)
    } catch (err) {
      $app.logger().error('lembrete entrevista falhou', 'error', String(err), 'to', email)
    }
  }
})
