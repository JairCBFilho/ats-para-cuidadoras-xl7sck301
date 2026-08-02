migrate(
  (app) => {
    const candidatasCol = app.findCollectionByNameOrId('candidatas')
    if (!candidatasCol.fields.getByName('foto')) {
      candidatasCol.fields.add(
        new FileField({
          name: 'foto',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    app.save(candidatasCol)

    const appsCol = app.findCollectionByNameOrId('applications')
    if (!appsCol.fields.getByName('compatibilidade')) {
      appsCol.fields.add(
        new NumberField({
          name: 'compatibilidade',
          min: 0,
          max: 100,
          onlyInt: true,
        }),
      )
    }
    appsCol.addIndex('idx_applications_compatibilidade', false, 'compatibilidade', '')
    app.save(appsCol)
  },
  (app) => {
    const candidatasCol = app.findCollectionByNameOrId('candidatas')
    const fotoField = candidatasCol.fields.getByName('foto')
    if (fotoField) candidatasCol.fields.remove(fotoField)
    app.save(candidatasCol)

    const appsCol = app.findCollectionByNameOrId('applications')
    appsCol.removeIndex('idx_applications_compatibilidade')
    const compatField = appsCol.fields.getByName('compatibilidade')
    if (compatField) appsCol.fields.remove(compatField)
    app.save(appsCol)
  },
)
