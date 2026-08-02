migrate(
  (app) => {
    var candidatas = app.findRecordsByFilter('candidatas', "id != ''", 'created', 100, 0)
    var demoEmails = ['ana.silva@email.com', 'maria.santos@email.com', 'julia.lima@email.com']

    for (var i = 0; i < candidatas.length; i++) {
      var c = candidatas[i]
      if (!c.getString('email')) {
        c.set('email', demoEmails[i] || 'candidata' + (i + 1) + '@email.com')
        app.save(c)
      }
    }

    var refCol = app.findCollectionByNameOrId('referencias')

    function seedRef(candidataId, nome, contato, relacionamento, status, observacoes) {
      var existing = app.findRecordsByFilter(
        'referencias',
        "candidata = '" + candidataId + "' && nome = '" + nome + "'",
        'created',
        1,
        0,
      )
      if (existing.length > 0) return

      var ref = new Record(refCol)
      ref.set('candidata', candidataId)
      ref.set('nome', nome)
      ref.set('contato', contato)
      ref.set('relacionamento', relacionamento)
      ref.set('status', status)
      ref.set('observacoes', observacoes)
      app.save(ref)
    }

    if (candidatas.length >= 1) {
      seedRef(
        candidatas[0].id,
        'Dona Helena Costa',
        '(11) 98765-4321',
        'Ex-empregadora',
        'confirmada',
        'Excelente profissional, muito dedicada e cuidadosa com a paciente.',
      )
      seedRef(
        candidatas[0].id,
        'Dr. Carlos Mendes',
        'carlos.mendes@clinica.com.br',
        'Medico da paciente',
        'pendente',
        'Aguardando retorno para confirmacao.',
      )
    }

    if (candidatas.length >= 2) {
      seedRef(
        candidatas[1].id,
        'Sra. Patricia Gomes',
        '(11) 91234-5678',
        'Vizinha da paciente',
        'rejeitada',
        'Nao recomendou a profissional, relatou atrasos frequentes.',
      )
      seedRef(
        candidatas[1].id,
        'Sr. Joao Ferreira',
        '(11) 99876-5432',
        'Ex-empregador',
        'confirmada',
        'Muito satisfeito com o trabalho, recomenda fortemente.',
      )
    }

    if (candidatas.length >= 3) {
      seedRef(
        candidatas[2].id,
        'Dona Rita Souza',
        '(11) 97654-3210',
        'Filha da paciente',
        'pendente',
        'Aguardando contato telefonico.',
      )
    }
  },
  (app) => {
    try {
      var refs = app.findRecordsByFilter('referencias', "id != ''", 'created', 100, 0)
      for (var i = 0; i < refs.length; i++) {
        app.delete(refs[i])
      }
    } catch (_) {}
  },
)
