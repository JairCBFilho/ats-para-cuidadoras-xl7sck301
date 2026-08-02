migrate(
  (app) => {
    const collection = new Collection({
      name: 'vagas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'cargo', type: 'text', required: true },
        { name: 'localizacao', type: 'text', required: true },
        { name: 'turno', type: 'select', required: true, values: ['12h', '24h'], maxSelect: 1 },
        { name: 'requisitos', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['aberta', 'fechada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_vagas_status ON vagas (status)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('vagas')
    app.delete(collection)
  },
)
