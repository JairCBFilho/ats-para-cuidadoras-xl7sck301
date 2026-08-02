migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_templates')
    var templates = [
      {
        etapa: 'Triagem',
        mensagem:
          'Ola {nome_candidata}! Sua candidatura para {cargo} esta em triagem. Em breve entraremos em contato.',
      },
      {
        etapa: 'Entrevista',
        mensagem:
          'Ola {nome_candidata}! Parabens, voce foi convocada para entrevista para a vaga de {cargo}. Entraremos em contato para agendar. Data: {data_entrevista}',
      },
      {
        etapa: 'Aprovada',
        mensagem:
          'Ola {nome_candidata}! Parabens, voce foi aprovada para a vaga de {cargo}! Em breve entraremos em contato.',
      },
      {
        etapa: 'Rejeitada',
        mensagem:
          'Ola {nome_candidata}. Agradecemos seu interesse na vaga de {cargo}, mas nao foi possivel dar continuidade. Desejamos sucesso!',
      },
    ]
    for (var i = 0; i < templates.length; i++) {
      var t = templates[i]
      var existing = app.findRecordsByFilter(
        'email_templates',
        "etapa = '" + t.etapa + "' && canal = 'whatsapp'",
        'created',
        1,
        0,
      )
      if (existing.length > 0) continue
      var record = new Record(col)
      record.set('etapa', t.etapa)
      record.set('canal', 'whatsapp')
      record.set('assunto', '')
      record.set('corpo', t.mensagem)
      app.save(record)
    }
  },
  (app) => {
    try {
      var records = app.findRecordsByFilter(
        'email_templates',
        "canal = 'whatsapp'",
        'created',
        100,
        0,
      )
      for (var i = 0; i < records.length; i++) app.delete(records[i])
    } catch (_) {}
  },
)
