migrate(
  (app) => {
    // --- 1) Flag score_avaliado em applications (distingue score 0 real de "nao avaliado") ---
    var appsCol = app.findCollectionByNameOrId('applications')
    if (!appsCol.fields.getByName('score_avaliado')) {
      appsCol.fields.add(new BoolField({ name: 'score_avaliado' }))
    }
    app.save(appsCol)

    // Registros antigos ja passaram pelo fluxo sincrono — marcar como avaliados
    // para o cron assincrono nao reprocessar o historico inteiro.
    var antigos = app.findRecordsByFilter(
      'applications',
      'score_avaliado != true',
      'created',
      5000,
      0,
    )
    for (var i = 0; i < antigos.length; i++) {
      antigos[i].set('score_avaliado', true)
      app.saveNoValidate(antigos[i])
    }

    // --- 2) Dedupe de candidaturas duplicadas (mesma vaga + candidata) ---
    var todos = app.findRecordsByFilter('applications', "id != ''", 'created', 5000, 0)
    var seen = {}
    var removidos = 0
    for (var k = 0; k < todos.length; k++) {
      var key = todos[k].getString('vaga') + '|' + todos[k].getString('candidata')
      if (seen[key]) {
        app.delete(todos[k])
        removidos++
      } else {
        seen[key] = true
      }
    }

    // --- 3) Indice unique (vaga, candidata) — impede duplicatas no banco ---
    var appsCol2 = app.findCollectionByNameOrId('applications')
    var temIdx = false
    for (var j = 0; j < appsCol2.indexes.length; j++) {
      if (String(appsCol2.indexes[j]).indexOf('idx_applications_unique_vaga_candidata') !== -1)
        temIdx = true
    }
    if (!temIdx) {
      appsCol2.indexes.push(
        'CREATE UNIQUE INDEX idx_applications_unique_vaga_candidata ON applications (vaga, candidata)',
      )
    }

    // --- 4) Cascade delete: sem orfaos ao deletar candidata/vaga/entrevista ---
    var fCand = appsCol2.fields.getByName('candidata')
    if (fCand) fCand.cascadeDelete = true
    var fVaga = appsCol2.fields.getByName('vaga')
    if (fVaga) fVaga.cascadeDelete = true
    app.save(appsCol2)

    var entCol = app.findCollectionByNameOrId('entrevistas')
    var eCand = entCol.fields.getByName('candidata')
    if (eCand) eCand.cascadeDelete = true
    var eVaga = entCol.fields.getByName('vaga')
    if (eVaga) eVaga.cascadeDelete = true
    app.save(entCol)

    var notCol = app.findCollectionByNameOrId('notificacoes')
    var nCand = notCol.fields.getByName('candidata')
    if (nCand) nCand.cascadeDelete = true
    var nVaga = notCol.fields.getByName('vaga')
    if (nVaga) nVaga.cascadeDelete = true
    var nEnt = notCol.fields.getByName('entrevista')
    if (nEnt) nEnt.cascadeDelete = true
    app.save(notCol)
  },
  (app) => {
    // Down: remove campo e indice (cascades ficam)
    var appsCol = app.findCollectionByNameOrId('applications')
    var f = appsCol.fields.getByName('score_avaliado')
    if (f) appsCol.fields.remove(f)
    var novos = []
    for (var i = 0; i < appsCol.indexes.length; i++) {
      if (String(appsCol.indexes[i]).indexOf('idx_applications_unique_vaga_candidata') === -1)
        novos.push(appsCol.indexes[i])
    }
    appsCol.indexes = novos
    app.save(appsCol)
  },
)
