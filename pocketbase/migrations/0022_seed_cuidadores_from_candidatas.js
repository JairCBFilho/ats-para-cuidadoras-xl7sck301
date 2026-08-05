migrate(
  (app) => {
    var existing = app.findRecordsByFilter('cuidadores', "id != ''", 'created', 1, 0)
    if (existing.length > 0) return

    var candidatas = app.findRecordsByFilter('candidatas', "id != ''", 'created', 500, 0)
    var cuidadoresCol = app.findCollectionByNameOrId('cuidadores')

    for (var i = 0; i < candidatas.length; i++) {
      var c = candidatas[i]
      var record = new Record(cuidadoresCol)
      record.set('nome', c.getString('nome'))
      record.set('formacao', c.getString('formacao'))
      record.set('localizacao', c.getString('localizacao'))
      record.set('experiencia', c.getString('experiencia'))
      record.set('email', c.getString('email'))
      record.set('telefone', c.getString('telefone'))
      record.set('origem', c.getString('origem'))
      record.set('linkedin', c.getString('linkedin'))
      record.set('portfolio', c.getString('portfolio'))
      record.set('disponibilidade', 'disponível')
      app.save(record)
    }
  },
  (app) => {
    try {
      var cuidadores = app.findRecordsByFilter('cuidadores', "id != ''", 'created', 500, 0)
      for (var i = 0; i < cuidadores.length; i++) {
        app.delete(cuidadores[i])
      }
    } catch (_) {}
  },
)
