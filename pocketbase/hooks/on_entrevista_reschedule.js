// Reagendamento de entrevista (decisao do Jair, 26/09):
// Quando data_hora (ou status) muda:
//  1) reseta lembrete_enviado na candidatura vinculada — o lembrete de 24h
//     volta a ser elegivel para a NOVA data;
//  2) remove a notificacao 'entrevista_proxima' antiga (o cron recria com a
//     data nova na proxima hora).
onRecordAfterUpdateSuccess((e) => {
  var oldData = e.record.original().getString('data_hora')
  var newData = e.record.getString('data_hora')
  var oldStatus = e.record.original().getString('status')
  var newStatus = e.record.getString('status')
  if (oldData === newData && oldStatus === newStatus) return e.next()

  var candidataId = e.record.getString('candidata')
  var vagaId = e.record.getString('vaga')
  var entId = e.record.id

  // 1) Reset do lembrete na candidatura vinculada
  try {
    var apps = $app.findRecordsByFilter(
      'applications',
      'candidata = {:c} && vaga = {:v}',
      'created',
      1,
      0,
      { c: candidataId, v: vagaId },
    )
    if (apps.length > 0 && apps[0].getBool('lembrete_enviado')) {
      apps[0].set('lembrete_enviado', false)
      $app.saveNoValidate(apps[0])
      $app.logger().info('reagendamento: lembrete_enviado resetado', 'entrevistaId', entId)
    }
  } catch (err) {
    $app.logger().error('reschedule: reset lembrete falhou', 'error', String(err))
  }

  // 2) Notificacao antiga de entrevista_proxima fica com data invalida — remove
  try {
    var notifs = $app.findRecordsByFilter(
      'notificacoes',
      "entrevista = {:e} && tipo = 'entrevista_proxima'",
      'created',
      10,
      0,
      { e: entId },
    )
    for (var i = 0; i < notifs.length; i++) {
      $app.delete(notifs[i])
    }
  } catch (err) {
    $app.logger().error('reschedule: remocao de notificacao falhou', 'error', String(err))
  }

  return e.next()
}, 'entrevistas')
