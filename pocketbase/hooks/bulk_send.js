routerAdd(
  'POST',
  '/backend/v1/comunicacao/bulk-send',
  (e) => {
    var body = e.requestInfo().body || {}
    var candidataIds = body.candidataIds || []
    var vagaId = body.vagaId
    var etapa = body.etapa
    var canal = body.canal

    if (!candidataIds.length || !vagaId || !etapa || !canal)
      return e.badRequestError('candidataIds, vagaId, etapa e canal sao obrigatorios')

    var templates = $app.findRecordsByFilter(
      'email_templates',
      "etapa = '" + etapa + "' && canal = '" + canal + "'",
      'created',
      1,
      0,
    )

    var vaga = $app.findRecordById('vagas', vagaId)
    var cargo = vaga.getString('cargo')

    var results = []

    for (var i = 0; i < candidataIds.length; i++) {
      var candidataId = candidataIds[i]
      try {
        var candidata = $app.findRecordById('candidatas', candidataId)
        var nome = candidata.getString('nome')
        var email = candidata.getString('email')
        var telefone = candidata.getString('telefone')

        var assunto = 'Notificacao - ' + etapa
        var corpo = ''
        if (templates.length > 0) {
          assunto = templates[0].getString('assunto')
          corpo = templates[0].getString('corpo')
        }

        assunto = assunto
          .replace(/{nome_candidata}/g, nome)
          .replace(/{nome_vaga}/g, cargo)
          .replace(/{cargo}/g, cargo)
          .replace(/{etapa}/g, etapa)
          .replace(/{data_entrevista}/g, 'data a confirmar')
        corpo = corpo
          .replace(/{nome_candidata}/g, nome)
          .replace(/{nome_vaga}/g, cargo)
          .replace(/{cargo}/g, cargo)
          .replace(/{etapa}/g, etapa)
          .replace(/{data_entrevista}/g, 'data a confirmar')

        if (canal === 'email') {
          if (!email) {
            results.push({ candidataId: candidataId, success: false, error: 'sem email' })
            continue
          }
          var client = $app.newMailClient()
          client.send({
            from: { name: 'Lazuli ATS', address: 'noreply@lazuliats.com' },
            to: [{ name: nome, address: email }],
            subject: assunto,
            html: corpo,
          })
          results.push({ candidataId: candidataId, success: true })
        } else {
          var phone = telefone.replace(/[^\d]/g, '')
          var link = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(corpo)
          results.push({ candidataId: candidataId, success: true, link: link })
        }
      } catch (err) {
        results.push({ candidataId: candidataId, success: false, error: String(err) })
      }
    }

    return e.json(200, { results: results })
  },
  $apis.requireAuth(),
)
