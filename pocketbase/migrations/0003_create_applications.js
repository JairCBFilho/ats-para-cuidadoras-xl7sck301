migrate(
  (app) => {
    const vagasId = app.findCollectionByNameOrId('vagas').id
    const candidatasId = app.findCollectionByNameOrId('candidatas').id

    const collection = new Collection({
      name: 'applications',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'vaga',
          type: 'relation',
          required: true,
          collectionId: vagasId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'candidata',
          type: 'relation',
          required: true,
          collectionId: candidatasId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'etapa',
          type: 'select',
          required: true,
          values: ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_applications_vaga ON applications (vaga)',
        'CREATE INDEX idx_applications_candidata ON applications (candidata)',
        'CREATE INDEX idx_applications_etapa ON applications (etapa)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('applications')
    app.delete(collection)
  },
)
