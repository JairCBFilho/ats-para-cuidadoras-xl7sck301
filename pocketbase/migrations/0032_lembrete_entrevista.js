/// <reference path="../pb_data/types.d.ts" />
// 1. Adiciona o campo `lembrete_enviado` (bool, default false) à collection
//    `applications` para controlar o envio do lembrete de entrevista (24h antes).
// 2. Adiciona a etapa `LembreteEntrevista` ao select `etapa` de `email_templates`
//    e semeia um template padrao de e-mail de lembrete.
migrate(
  (app) => {
    // --- applications: lembrete_enviado ---
    var appsCol = app.findCollectionByNameOrId('applications')
    if (!appsCol.fields.getByName('lembrete_enviado')) {
      appsCol.fields.add(new BoolField({ name: 'lembrete_enviado' }))
    }
    app.save(appsCol)
    // Garante que registros existentes comecam com false.
    app
      .db()
      .newQuery('UPDATE applications SET lembrete_enviado = 0 WHERE lembrete_enviado IS NULL')
      .execute()

    // --- email_templates: nova etapa LembreteEntrevista + template padrao ---
    var tplCol = app.findCollectionByNameOrId('email_templates')
    var etapaField = tplCol.fields.getByName('etapa')
    if (etapaField && etapaField.values) {
      var vals = etapaField.values || []
      if (vals.indexOf('LembreteEntrevista') === -1) {
        etapaField.values = vals.concat(['LembreteEntrevista'])
      }
    }
    app.save(tplCol)

    var existing = app.findRecordsByFilter(
      'email_templates',
      "etapa = 'LembreteEntrevista' && canal = 'email'",
      'created',
      1,
      0,
    )
    if (existing.length === 0) {
      var record = new Record(tplCol)
      record.set('etapa', 'LembreteEntrevista')
      record.set('canal', 'email')
      record.set('assunto', 'Lazuli ATS - Lembrete: sua entrevista para {nome_vaga} sera amanha')
      record.set(
        'corpo',
        '<h2>Ola, {nome_candidata}!</h2>' +
          '<p>Este e um lembrete da sua entrevista para a vaga de <strong>{nome_vaga}</strong>.</p>' +
          '<p><strong>Data e hora:</strong> {data_entrevista}</p>' +
          '<p>Por favor, confirme sua presenca. Em caso de imprevisto, responda este e-mail.</p>' +
          '<p>Ate logo!<br>Equipe Lazuli ATS</p>',
      )
      app.save(record)
    }
  },
  (app) => {
    // Reverte: remove o template semeado, a etapa do select e o campo.
    try {
      var records = app.findRecordsByFilter(
        'email_templates',
        "etapa = 'LembreteEntrevista'",
        'created',
        100,
        0,
      )
      for (var i = 0; i < records.length; i++) app.delete(records[i])
    } catch (_) {}

    var tplCol = app.findCollectionByNameOrId('email_templates')
    var etapaField = tplCol.fields.getByName('etapa')
    if (etapaField && etapaField.values) {
      etapaField.values = (etapaField.values || []).filter(function (v) {
        return v !== 'LembreteEntrevista'
      })
    }
    app.save(tplCol)

    var appsCol = app.findCollectionByNameOrId('applications')
    var f = appsCol.fields.getByName('lembrete_enviado')
    if (f) appsCol.fields.remove(f)
    app.save(appsCol)
  },
)
