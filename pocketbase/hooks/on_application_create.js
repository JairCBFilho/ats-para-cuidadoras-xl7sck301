// Ao criar uma candidatura: apenas notifica. O score de IA agora e calculado
// de forma ASSINCRONA pelo cron 'triagem_ia_fila' (cron_triagem_ia.js) — o
// request do usuario nao espera mais a IA.
onRecordAfterCreateSuccess((e) => {
  var candidataId = e.record.getString('candidata')
  var vagaId = e.record.getString('vaga')

  try {
    var candidata = $app.findRecordById('candidatas', candidataId)
    var vaga = $app.findRecordById('vagas', vagaId)
    var nome = candidata.getString('nome')
    var cargo = vaga.getString('cargo')

    var notifCol = $app.findCollectionByNameOrId('notificacoes')
    var notif = new Record(notifCol)
    notif.set('mensagem', 'Nova candidatura: ' + nome + ' para ' + cargo)
    notif.set('tipo', 'nova_candidatura')
    notif.set('lida', false)
    notif.set('candidata', candidataId)
    notif.set('vaga', vagaId)
    $app.save(notif)
  } catch (err) {
    $app.logger().error('failed to create notification', 'error', String(err))
  }

  return e.next()
}, 'applications')
