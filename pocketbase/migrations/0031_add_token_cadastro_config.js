migrate(
  (app) => {
    // Adiciona campo `token_cadastro` à collection `configuracoes` para
    // armazenar o token público de cadastro (gerenciável pela UI de admin).
    var col = app.findCollectionByNameOrId('configuracoes')
    if (!col.fields.getByName('token_cadastro')) {
      col.fields.add(new TextField({ name: 'token_cadastro' }))
    }
    app.save(col)

    // Semente: gera um token aleatório inicial se não houver.
    var tokenSeed = $security.randomString(32)
    try {
      var existing = app.findFirstRecordByData('configuracoes', 'canal_manual', 'email')
      if (!existing.getString('token_cadastro')) {
        existing.set('token_cadastro', 'cuid_pub_' + tokenSeed)
        app.save(existing)
      }
    } catch (_) {
      // Se não houver registro, cria um com o token.
      var record = new Record(col)
      record.set('canal_manual', 'email')
      record.set('token_cadastro', 'cuid_pub_' + tokenSeed)
      app.save(record)
    }
  },
  (app) => {
    var col = app.findCollectionByNameOrId('configuracoes')
    var f = col.fields.getByName('token_cadastro')
    if (f) col.fields.remove(f)
    app.save(col)
  },
)
