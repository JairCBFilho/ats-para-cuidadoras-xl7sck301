migrate(
  (app) => {
    // --- Adiciona campo role nos usuarios ---
    var users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({ name: 'role', values: ['admin', 'recrutador'], maxSelect: 1 }),
      )
    }
    // Fecha signup publico: so cria quem ja esta autenticado (ninguem, na pratica)
    users.createRule = null
    users.updateRule = '@request.auth.id = id'
    users.deleteRule = null
    app.save(users)

    // --- Semente: admin do usuario existente ---
    try {
      var admin = app.findAuthRecordByEmail('_pb_users_auth_', 'jaircbfilho@gmail.com')
      if (!admin.getString('role')) {
        admin.set('role', 'admin')
        app.save(admin)
      }
    } catch (_) {
      /* sem seed — ok */
    }

    // --- Colecao convites ---
    var col = new Collection({
      name: 'convites',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'token', type: 'text', required: true },
        {
          name: 'role',
          type: 'select',
          values: ['admin', 'recrutador'],
          required: true,
          maxSelect: 1,
        },
        { name: 'usado', type: 'bool' },
        { name: 'expires_at', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_convites_token ON convites (token)'],
    })
    app.save(col)
  },
  (app) => {
    // Restaura regras originais dos usuarios
    var users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = "@request.auth.id != ''"
    users.updateRule = "@request.auth.id != ''"
    users.deleteRule = null
    app.save(users)
    // Remove colecao convites
    try {
      var convites = app.findCollectionByNameOrId('convites')
      app.delete(convites)
    } catch (_) {
      /* nao existe — ok */
    }
  },
)
