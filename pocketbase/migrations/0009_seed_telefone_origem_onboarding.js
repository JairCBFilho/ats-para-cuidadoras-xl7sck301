migrate(
  (app) => {
    var candidatas = app.findRecordsByFilter('candidatas', "id != ''", 'created', 100, 0)
    var telefones = ['+55 11 98123-4567', '+55 11 97234-5678', '+55 11 96345-6789']
    var origens = ['Indicação', 'LinkedIn', 'WhatsApp']

    for (var i = 0; i < candidatas.length; i++) {
      var c = candidatas[i]
      if (!c.getString('telefone')) {
        c.set('telefone', telefones[i] || '+55 11 99000-0000')
      }
      if (!c.getString('origem')) {
        c.set('origem', origens[i] || 'Outro')
      }
      app.save(c)
    }

    var onboardingCol = app.findCollectionByNameOrId('onboarding')
    var approvedApps = app.findRecordsByFilter(
      'applications',
      "etapa = 'Aprovada'",
      'created',
      100,
      0,
    )

    var seedTask = function (candidataId, tarefa, categoria, status) {
      var existing = app.findRecordsByFilter(
        'onboarding',
        "candidata = '" + candidataId + "' && tarefa = '" + tarefa + "'",
        'created',
        1,
        0,
      )
      if (existing.length > 0) return
      var record = new Record(onboardingCol)
      record.set('candidata', candidataId)
      record.set('tarefa', tarefa)
      record.set('categoria', categoria)
      record.set('status', status)
      app.save(record)
    }

    for (var j = 0; j < approvedApps.length; j++) {
      var candId = approvedApps[j].getString('candidata')
      seedTask(candId, 'Assinatura de contrato de trabalho', 'Contrato', 'pendente')
      seedTask(candId, 'Entrega de exames admissionais', 'Documentação', 'pendente')
      seedTask(candId, 'Treinamento de cuidados com idosos', 'Treinamento', 'pendente')
      seedTask(candId, 'Apresentação à família da paciente', 'Outro', 'concluida')
    }
  },
  (app) => {
    try {
      var tasks = app.findRecordsByFilter('onboarding', "id != ''", 'created', 100, 0)
      for (var i = 0; i < tasks.length; i++) {
        app.delete(tasks[i])
      }
    } catch (_) {}
  },
)
