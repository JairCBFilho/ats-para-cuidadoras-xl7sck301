migrate(
  (app) => {
    const candidatasCol = app.findCollectionByNameOrId('candidatas')
    if (!candidatasCol.fields.getByName('telefone')) {
      candidatasCol.fields.add(new TextField({ name: 'telefone', required: false }))
    }
    if (!candidatasCol.fields.getByName('origem')) {
      candidatasCol.fields.add(
        new SelectField({
          name: 'origem',
          required: false,
          values: ['Indicação', 'LinkedIn', 'Instagram', 'Site', 'WhatsApp', 'Outro'],
          maxSelect: 1,
        }),
      )
    }
    candidatasCol.addIndex('idx_candidatas_origem', false, 'origem', '')
    app.save(candidatasCol)

    const candidatasId = app.findCollectionByNameOrId('candidatas').id
    const onboardingCol = new Collection({
      name: 'onboarding',
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
        { name: 'tarefa', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['Documentação', 'Treinamento', 'Contrato', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'concluida'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_onboarding_candidata ON onboarding (candidata)',
        'CREATE INDEX idx_onboarding_status ON onboarding (status)',
      ],
    })
    app.save(onboardingCol)
  },
  (app) => {
    try {
      const onboardingCol = app.findCollectionByNameOrId('onboarding')
      app.delete(onboardingCol)
    } catch (_) {}
    try {
      const candidatasCol = app.findCollectionByNameOrId('candidatas')
      const telefoneField = candidatasCol.fields.getByName('telefone')
      if (telefoneField) candidatasCol.fields.remove(telefoneField.getId())
      const origemField = candidatasCol.fields.getByName('origem')
      if (origemField) candidatasCol.fields.remove(origemField.getId())
      candidatasCol.removeIndex('idx_candidatas_origem')
      app.save(candidatasCol)
    } catch (_) {}
  },
)
