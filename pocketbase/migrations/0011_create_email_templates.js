migrate(
  (app) => {
    const collection = new Collection({
      name: 'email_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'etapa',
          type: 'select',
          required: true,
          values: ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada'],
          maxSelect: 1,
        },
        { name: 'assunto', type: 'text', required: true },
        { name: 'corpo', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_email_templates_etapa ON email_templates (etapa)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('email_templates')
    app.delete(collection)
  },
)
