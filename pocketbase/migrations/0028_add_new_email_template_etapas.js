/// <reference path="../pb_data/types.d.ts" />
// Adiciona duas novas etapas de comunicacao ao select `etapa` de email_templates:
//   - AtualizacaoCadastro
//   - VerificacaoDisponibilidade
// e semeia templates padrao (email + whatsapp) para essas novas etapas.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_templates')

    // Atualiza o campo select `etapa` para incluir os novos valores.
    const etapaField = col.fields.getByName('etapa')
    if (etapaField) {
      etapaField.values = [
        'Triagem',
        'Entrevista',
        'Aprovada',
        'Rejeitada',
        'AtualizacaoCadastro',
        'VerificacaoDisponibilidade',
      ]
    }

    app.save(col)

    // Templates padrao para as novas etapas.
    var defaults = [
      {
        etapa: 'AtualizacaoCadastro',
        canal: 'email',
        assunto: 'CuidarATS - Atualize seus dados cadastrais',
        corpo:
          '<h2>Ola, {nome_candidata}!</h2>' +
          '<p>Precisamos atualizar seus dados cadastrais para manter seu perfil ativo em nosso banco de talentos.</p>' +
          '<p>Por favor, acesse o sistema e confirme/atualize suas informacoes: endereco, telefone, disponibilidade e documentos.</p>' +
          '<p>Se tiver duvidas, responda este e-mail.</p>' +
          '<p>Equipe CuidarATS</p>',
      },
      {
        etapa: 'AtualizacaoCadastro',
        canal: 'whatsapp',
        assunto: 'WhatsApp: Atualizacao de Cadastro',
        corpo:
          'Ola {nome_candidata}! Precisamos atualizar seus dados cadastrais. Por favor, confirme seus dados (endereco, telefone, disponibilidade) para mantermos seu perfil ativo. Equipe CuidarATS.',
      },
      {
        etapa: 'VerificacaoDisponibilidade',
        canal: 'email',
        assunto: 'CuidarATS - Tem disponibilidade para um plantao extra?',
        corpo:
          '<h2>Ola, {nome_candidata}!</h2>' +
          '<p>Temos uma oportunidade de plantao extra e gostariamos de verificar sua disponibilidade.</p>' +
          '<p>Por favor, responda este e-mail informando se voce tem disponibilidade nos proximos dias e em quais turnos.</p>' +
          '<p>Equipe CuidarATS</p>',
      },
      {
        etapa: 'VerificacaoDisponibilidade',
        canal: 'whatsapp',
        assunto: 'WhatsApp: Verificacao de Disponibilidade',
        corpo:
          'Ola {nome_candidata}! Temos uma oportunidade de plantao extra. Voce tem disponibilidade nos proximos dias? Nos informe seu turno e disponibilidade. Equipe CuidarATS.',
      },
    ]

    for (var i = 0; i < defaults.length; i++) {
      var d = defaults[i]
      var existing = app.findRecordsByFilter(
        'email_templates',
        "etapa = '" + d.etapa + "' && canal = '" + d.canal + "'",
        'created',
        1,
        0,
      )
      if (existing.length > 0) continue
      var record = new Record(col)
      record.set('etapa', d.etapa)
      record.set('canal', d.canal)
      record.set('assunto', d.assunto)
      record.set('corpo', d.corpo)
      app.save(record)
    }
  },
  (app) => {
    // Remove os templates semeados para as novas etapas.
    try {
      var records = app.findRecordsByFilter(
        'email_templates',
        "etapa = 'AtualizacaoCadastro' || etapa = 'VerificacaoDisponibilidade'",
        'created',
        100,
        0,
      )
      for (var i = 0; i < records.length; i++) app.delete(records[i])
    } catch (_) {}

    // Reverte o select para os valores originais.
    const col = app.findCollectionByNameOrId('email_templates')
    const etapaField = col.fields.getByName('etapa')
    if (etapaField) {
      etapaField.values = ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada']
    }
    app.save(col)
  },
)
