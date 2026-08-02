migrate(
  (app) => {
    const candidatasCol = app.findCollectionByNameOrId('candidatas')
    if (!candidatasCol.fields.getByName('curriculo')) {
      candidatasCol.fields.add(
        new FileField({
          name: 'curriculo',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf'],
        }),
      )
    }
    if (!candidatasCol.fields.getByName('linkedin')) {
      candidatasCol.fields.add(new TextField({ name: 'linkedin' }))
    }
    if (!candidatasCol.fields.getByName('portfolio')) {
      candidatasCol.fields.add(new TextField({ name: 'portfolio' }))
    }
    app.save(candidatasCol)

    const appsCol = app.findCollectionByNameOrId('applications')
    if (!appsCol.fields.getByName('pontos_fortes')) {
      appsCol.fields.add(new TextField({ name: 'pontos_fortes' }))
    }
    if (!appsCol.fields.getByName('pontos_atencao')) {
      appsCol.fields.add(new TextField({ name: 'pontos_atencao' }))
    }
    if (!appsCol.fields.getByName('justificativa')) {
      appsCol.fields.add(new TextField({ name: 'justificativa' }))
    }
    app.save(appsCol)
  },
  (app) => {
    const candidatasCol = app.findCollectionByNameOrId('candidatas')
    for (const fn of ['curriculo', 'linkedin', 'portfolio']) {
      const f = candidatasCol.fields.getByName(fn)
      if (f) candidatasCol.fields.remove(f)
    }
    app.save(candidatasCol)
    const appsCol = app.findCollectionByNameOrId('applications')
    for (const fn of ['pontos_fortes', 'pontos_atencao', 'justificativa']) {
      const f = appsCol.fields.getByName(fn)
      if (f) appsCol.fields.remove(f)
    }
    app.save(appsCol)
  },
)
