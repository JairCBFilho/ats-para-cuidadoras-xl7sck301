migrate(
  (app) => {
    // Correcao de fuso: o formulario antigo enviava "YYYY-MM-DDTHH:mm" sem fuso
    // e o PocketBase gravava como UTC — uma entrevista marcada para 11:00 (BRT)
    // ficava gravada como 11:00Z (= 08:00 BRT), 3h adiantada.
    // A partir de agora o formulario converte BRT -> UTC ao salvar. Esta migration
    // desloca +3h as entrevistas FUTURAS para restaurar a intencao original.
    var agora = new Date().toISOString().replace('T', ' ')
    var futuras = app.findRecordsByFilter(
      'entrevistas',
      'data_hora > {:agora}',
      'data_hora',
      500,
      0,
      { agora: agora },
    )
    var deslocadas = 0
    for (var i = 0; i < futuras.length; i++) {
      var rec = futuras[i]
      var d = new Date(rec.getString('data_hora'))
      if (isNaN(d.getTime())) continue
      var nova = new Date(d.getTime() + 3 * 60 * 60 * 1000)
      rec.set('data_hora', nova.toISOString().replace('T', ' '))
      app.saveNoValidate(rec)
      deslocadas++
    }
  },
  (app) => {
    // Down: desfaz o deslocamento nas futuras (-3h)
    var agora = new Date().toISOString().replace('T', ' ')
    var futuras = app.findRecordsByFilter(
      'entrevistas',
      'data_hora > {:agora}',
      'data_hora',
      500,
      0,
      { agora: agora },
    )
    for (var i = 0; i < futuras.length; i++) {
      var rec = futuras[i]
      var d = new Date(rec.getString('data_hora'))
      if (isNaN(d.getTime())) continue
      var nova = new Date(d.getTime() - 3 * 60 * 60 * 1000)
      rec.set('data_hora', nova.toISOString().replace('T', ' '))
      app.saveNoValidate(rec)
    }
  },
)
