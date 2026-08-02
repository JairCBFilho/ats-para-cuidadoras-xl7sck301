migrate(
  (app) => {
    const candidatasId = app.findCollectionByNameOrId('candidatas').id
    const vagasId = app.findCollectionByNameOrId('vagas').id
    const entrevistasId = app.findCollectionByNameOrId('entrevistas').id

    const collection = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'mensagem', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['nova_candidatura', 'entrevista_proxima'],
          maxSelect: 1,
        },
        { name: 'lida', type: 'bool' },
        {
          name: 'candidata',
          type: 'relation',
          collectionId: candidatasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'vaga',
          type: 'relation',
          collectionId: vagasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'entrevista',
          type: 'relation',
          collectionId: entrevistasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notificacoes_lida ON notificacoes (lida)',
        'CREATE INDEX idx_notificacoes_tipo ON notificacoes (tipo)',
        'CREATE INDEX idx_notificacoes_entrevista_tipo ON notificacoes (entrevista, tipo)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('notificacoes')
    app.delete(collection)
  },
)
