migrate(
  (app) => {
    const candidatasId = app.findCollectionByNameOrId('candidatas').id

    const collection = new Collection({
      name: 'referencias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'candidata',
          type: 'relation',
          required: true,
          collectionId: candidatasId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'contato', type: 'text', required: true },
        { name: 'relacionamento', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'confirmada', 'rejeitada'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_referencias_candidata ON referencias (candidata)',
        'CREATE INDEX idx_referencias_status ON referencias (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('referencias')
    app.delete(collection)
  },
)
