migrate(
  (app) => {
    const collection = new Collection({
      name: 'configuracoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'canal_manual',
          type: 'select',
          required: true,
          values: ['email', 'whatsapp'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
    try {
      app.findFirstRecordByData('configuracoes', 'canal_manual', 'email')
    } catch (_) {
      const record = new Record(collection)
      record.set('canal_manual', 'email')
      app.save(record)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('configuracoes')
    app.delete(collection)
  },
)
