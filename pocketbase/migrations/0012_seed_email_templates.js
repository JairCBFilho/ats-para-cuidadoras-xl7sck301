migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_templates')

    var templates = [
      {
        etapa: 'Triagem',
        assunto: 'CuidarATS - Sua candidatura para {cargo} esta em triagem',
        corpo:
          '<h2>Ola, {nome_candidata}!</h2><p>Sua candidatura para a vaga de <strong>{cargo}</strong> foi atualizada para a etapa de <strong>{etapa}</strong>.</p><p>Em breve entraremos em contato com mais informacoes.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
      },
      {
        etapa: 'Entrevista',
        assunto: 'CuidarATS - Voce foi convocada para entrevista!',
        corpo:
          '<h2>Ola, {nome_candidata}!</h2><p>Parabens! Sua candidatura para a vaga de <strong>{cargo}</strong> avancou para a etapa de <strong>{etapa}</strong>.</p><p>Entraremos em contato para agendar a sua entrevista.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
      },
      {
        etapa: 'Aprovada',
        assunto: 'CuidarATS - Parabens, voce foi aprovada!',
        corpo:
          '<h2>Ola, {nome_candidata}!</h2><p>Temos o prazer de informar que voce foi <strong>aprovada</strong> para a vaga de <strong>{cargo}</strong>!</p><p>Em breve entraremos em contato com os proximos passos do processo de admissao.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
      },
      {
        etapa: 'Rejeitada',
        assunto: 'CuidarATS - Atualizacao sobre sua candidatura',
        corpo:
          '<h2>Ola, {nome_candidata}.</h2><p>Agradecemos o seu interesse na vaga de <strong>{cargo}</strong>.</p><p>Infelizmente, desta vez nao foi possivel dar continuidade a sua candidatura. Agradecemos o seu tempo e desejamos sucesso em suas futuras oportunidades.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
      },
    ]

    for (var i = 0; i < templates.length; i++) {
      var t = templates[i]
      try {
        app.findFirstRecordByData('email_templates', 'etapa', t.etapa)
      } catch (_) {
        var record = new Record(col)
        record.set('etapa', t.etapa)
        record.set('assunto', t.assunto)
        record.set('corpo', t.corpo)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      var records = app.findRecordsByFilter('email_templates', "id != ''", 'created', 100, 0)
      for (var i = 0; i < records.length; i++) {
        app.delete(records[i])
      }
    } catch (_) {}
  },
)
