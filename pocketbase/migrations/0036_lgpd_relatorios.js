migrate(
  (app) => {
    // 1) Colecao comunicacoes_log — auditoria de tudo que foi enviado
    var colExists = true
    try {
      app.findCollectionByNameOrId('comunicacoes_log')
    } catch (_) {
      colExists = false
    }
    if (!colExists) {
      var col = new Collection({
        name: 'comunicacoes_log',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'nome', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'canal', type: 'select', values: ['email', 'whatsapp'], maxSelect: 1 },
          { name: 'etapa', type: 'text' },
          { name: 'status', type: 'select', values: ['enviado', 'erro'], maxSelect: 1 },
          { name: 'detalhe', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_comunicacoes_email ON comunicacoes_log (email)',
          'CREATE INDEX idx_comunicacoes_created ON comunicacoes_log (created)',
        ],
      })
      app.save(col)
    }

    // 2) applications: data_aprovada / data_rejeitada + backfill (aprox. = updated)
    var appsCol = app.findCollectionByNameOrId('applications')
    if (!appsCol.fields.getByName('data_aprovada'))
      appsCol.fields.add(new DateField({ name: 'data_aprovada' }))
    if (!appsCol.fields.getByName('data_rejeitada'))
      appsCol.fields.add(new DateField({ name: 'data_rejeitada' }))
    app.save(appsCol)

    var todos = app.findRecordsByFilter('applications', "id != ''", 'created', 5000, 0)
    for (var i = 0; i < todos.length; i++) {
      var rec = todos[i]
      var etapa = rec.getString('etapa')
      if (etapa === 'Aprovada' && !rec.getString('data_aprovada')) {
        rec.set('data_aprovada', rec.getString('updated'))
        app.saveNoValidate(rec)
      } else if (etapa === 'Rejeitada' && !rec.getString('data_rejeitada')) {
        rec.set('data_rejeitada', rec.getString('updated'))
        app.saveNoValidate(rec)
      }
    }

    // 3) cuidadores: consentimento LGPD + backfill (declaracao assinada na origem)
    var cCol = app.findCollectionByNameOrId('cuidadores')
    if (!cCol.fields.getByName('consentimento_lgpd'))
      cCol.fields.add(new BoolField({ name: 'consentimento_lgpd' }))
    if (!cCol.fields.getByName('consentimento_data'))
      cCol.fields.add(new DateField({ name: 'consentimento_data' }))
    app.save(cCol)

    var cuds = app.findRecordsByFilter('cuidadores', "id != ''", 'created', 5000, 0)
    for (var k = 0; k < cuds.length; k++) {
      if (!cuds[k].getBool('consentimento_lgpd')) {
        cuds[k].set('consentimento_lgpd', true)
        cuds[k].set('consentimento_data', cuds[k].getString('created'))
        app.saveNoValidate(cuds[k])
      }
    }
  },
  (app) => {
    // Down: remove campos (colecao comunicacoes_log permanece)
    var appsCol = app.findCollectionByNameOrId('applications')
    var f1 = appsCol.fields.getByName('data_aprovada')
    if (f1) appsCol.fields.remove(f1)
    var f2 = appsCol.fields.getByName('data_rejeitada')
    if (f2) appsCol.fields.remove(f2)
    app.save(appsCol)
  },
)
