migrate(
  (app) => {
    const collection = new Collection({
      name: 'cuidadores',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'formacao', type: 'text' },
        { name: 'localizacao', type: 'text' },
        { name: 'experiencia', type: 'text' },
        { name: 'email', type: 'email', required: true },
        { name: 'telefone', type: 'text' },
        {
          name: 'origem',
          type: 'select',
          values: ['Indicação', 'LinkedIn', 'Instagram', 'Site', 'WhatsApp', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'foto',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'curriculo',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf'],
        },
        { name: 'linkedin', type: 'text' },
        { name: 'portfolio', type: 'text' },
        {
          name: 'disponibilidade',
          type: 'select',
          values: ['disponível', 'indisponível'],
          maxSelect: 1,
        },
        { name: 'especialidades', type: 'text' },
        { name: 'turno', type: 'select', values: ['12h', '24h'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cuidadores_disponibilidade ON cuidadores (disponibilidade)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cuidadores')
    app.delete(collection)
  },
)
