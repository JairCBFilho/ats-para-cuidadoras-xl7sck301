cronAdd('entrevista_proxima_check', '0 * * * *', () => {
  var now = new Date()
  var in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  var entrevistas = $app.findRecordsByFilter(
    'entrevistas',
    "status = 'agendada'",
    'data_hora',
    500,
    0,
  )

  for (var i = 0; i < entrevistas.length; i++) {
    var ent = entrevistas[i]
    var dataHora = new Date(ent.getString('data_hora'))

    if (dataHora <= now || dataHora > in24h) continue

    var entId = ent.id
    var candidataId = ent.getString('candidata')
    var vagaId = ent.getString('vaga')

    var existing = $app.findRecordsByFilter(
      'notificacoes',
      "entrevista = '" + entId + "' && tipo = 'entrevista_proxima'",
      'created',
      1,
      0,
    )
    if (existing.length > 0) continue

    try {
      var candidata = $app.findRecordById('candidatas', candidataId)
      var vaga = $app.findRecordById('vagas', vagaId)
      var nome = candidata.getString('nome')
      var cargo = vaga.getString('cargo')

      var pDay = dataHora.getDate() < 10 ? '0' + dataHora.getDate() : '' + dataHora.getDate()
      var pMonth =
        dataHora.getMonth() + 1 < 10
          ? '0' + (dataHora.getMonth() + 1)
          : '' + (dataHora.getMonth() + 1)
      var pHour = dataHora.getHours() < 10 ? '0' + dataHora.getHours() : '' + dataHora.getHours()
      var pMin =
        dataHora.getMinutes() < 10 ? '0' + dataHora.getMinutes() : '' + dataHora.getMinutes()
      var dataStr = pDay + '/' + pMonth + '/' + dataHora.getFullYear() + ' ' + pHour + ':' + pMin

      var notifCol = $app.findCollectionByNameOrId('notificacoes')
      var notif = new Record(notifCol)
      notif.set('mensagem', 'Entrevista próxima: ' + nome + ' - ' + cargo + ' em ' + dataStr)
      notif.set('tipo', 'entrevista_proxima')
      notif.set('lida', false)
      notif.set('candidata', candidataId)
      notif.set('vaga', vagaId)
      notif.set('entrevista', entId)
      $app.save(notif)
    } catch (err) {
      $app.logger().error('failed to create entrevista notification', 'error', String(err))
    }
  }
})
