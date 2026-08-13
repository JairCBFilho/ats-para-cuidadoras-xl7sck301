routerAdd(
  'POST',
  '/backend/v1/cadastro-publico/regenerar-token',
  (e) => {
    // Rota autenticada (admin) para regenerar o token de cadastro público.
    // Atualiza o registro na collection `configuracoes` (origem da verdade).
    var userId = e.auth ? e.auth.id : ''
    if (!userId) {
      throw new UnauthorizedError('Autenticação necessária')
    }

    var newToken = 'cuid_pub_' + $security.randomString(32)

    var record = null
    try {
      record = $app.findFirstRecordByData('configuracoes', 'canal_manual', 'email')
    } catch (_) {
      var col = $app.findCollectionByNameOrId('configuracoes')
      record = new Record(col)
      record.set('canal_manual', 'email')
    }
    record.set('token_cadastro', newToken)
    $app.save(record)

    return e.json(200, { token: newToken })
  },
  $apis.requireAuth(),
)
