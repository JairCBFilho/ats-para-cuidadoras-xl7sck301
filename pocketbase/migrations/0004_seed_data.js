migrate(
  (app) => {
    // Seed demo user (idempotent)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'jaircbfilho@gmail.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const record = new Record(users)
      record.setEmail('jaircbfilho@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Recrutador')
      app.save(record)
    }

    // Seed vacancies (idempotent)
    const vagasCol = app.findCollectionByNameOrId('vagas')
    const seedVaga = function (cargo, localizacao, turno, requisitos, status) {
      try {
        app.findFirstRecordByData('vagas', 'cargo', cargo)
      } catch (_) {
        var record = new Record(vagasCol)
        record.set('cargo', cargo)
        record.set('localizacao', localizacao)
        record.set('turno', turno)
        record.set('requisitos', requisitos)
        record.set('status', status)
        app.save(record)
      }
    }
    seedVaga(
      'Cuidadora de Idosos - Período Diurno',
      'São Paulo - SP',
      '12h',
      'Experiência com cuidados a idosos, paciência, responsabilidade e disponibilidade para finais de semana.',
      'aberta',
    )
    seedVaga(
      'Cuidadora de Idosos - Plantão Noturno',
      'Guarulhos - SP',
      '24h',
      'Disponibilidade para plantão 24h, experiência com pacientes acamados e conhecimento de primeiros socorros.',
      'aberta',
    )

    // Seed candidates (idempotent)
    var candidatasCol = app.findCollectionByNameOrId('candidatas')
    var seedCandidata = function (nome, formacao, localizacao, experiencia) {
      try {
        app.findFirstRecordByData('candidatas', 'nome', nome)
      } catch (_) {
        var record = new Record(candidatasCol)
        record.set('nome', nome)
        record.set('formacao', formacao)
        record.set('localizacao', localizacao)
        record.set('experiencia', experiencia)
        app.save(record)
      }
    }
    seedCandidata(
      'Maria Aparecida Silva',
      'Técnica em Enfermagem',
      'São Paulo - SP',
      '5 anos de experiência cuidando de idosos acamados, acompanhamento de medicação e higiene.',
    )
    seedCandidata(
      'Joana Batista Costa',
      'Auxiliar de Cuidador',
      'Guarulhos - SP',
      '3 anos cuidando de idosos com Alzheimer, experiência com alimentação por sonda e mobilização.',
    )
    seedCandidata(
      'Rita de Cássia Souza',
      'Cuidadora de Idosos Certificada',
      'Osasco - SP',
      '7 anos de experiência, cursos de primeiros socorros e cuidado com pacientes com demência.',
    )

    // Seed applications (idempotent)
    var appsCol = app.findCollectionByNameOrId('applications')
    var vaga1 = app.findFirstRecordByData('vagas', 'cargo', 'Cuidadora de Idosos - Período Diurno')
    var vaga2 = app.findFirstRecordByData('vagas', 'cargo', 'Cuidadora de Idosos - Plantão Noturno')
    var cand1 = app.findFirstRecordByData('candidatas', 'nome', 'Maria Aparecida Silva')
    var cand2 = app.findFirstRecordByData('candidatas', 'nome', 'Joana Batista Costa')
    var cand3 = app.findFirstRecordByData('candidatas', 'nome', 'Rita de Cássia Souza')

    var seedApp = function (vagaId, candidataId, etapa) {
      try {
        app.findFirstRecordByFilter(
          'applications',
          'vaga = {:v} && candidata = {:c}',
          vagaId,
          candidataId,
        )
      } catch (_) {
        var record = new Record(appsCol)
        record.set('vaga', vagaId)
        record.set('candidata', candidataId)
        record.set('etapa', etapa)
        app.save(record)
      }
    }
    seedApp(vaga1.id, cand1.id, 'Triagem')
    seedApp(vaga1.id, cand2.id, 'Entrevista')
    seedApp(vaga2.id, cand3.id, 'Aprovada')
    seedApp(vaga2.id, cand1.id, 'Rejeitada')
  },
  (app) => {
    try {
      var record = app.findAuthRecordByEmail('_pb_users_auth_', 'jaircbfilho@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
