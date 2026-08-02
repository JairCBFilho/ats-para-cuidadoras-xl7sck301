migrate(
  (app) => {
    const candidatasId = app.findCollectionByNameOrId('candidatas').id
    const vagasId = app.findCollectionByNameOrId('vagas').id
    const collection = new Collection({
      name: 'entrevistas',
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
          cascadeDelete: false,
        },
        {
          name: 'vaga',
          type: 'relation',
          required: true,
          collectionId: vagasId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'data_hora', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['agendada', 'realizada', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_entrevistas_candidata ON entrevistas (candidata)',
        'CREATE INDEX idx_entrevistas_vaga ON entrevistas (vaga)',
        'CREATE INDEX idx_entrevistas_data_hora ON entrevistas (data_hora)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('entrevistas')
    app.delete(collection)
  },
)
