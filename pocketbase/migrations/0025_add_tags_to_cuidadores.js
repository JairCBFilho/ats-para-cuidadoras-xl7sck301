migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cuidadores')

    // Campo de tags (texto, separado por vírgulas)
    if (!col.fields.getByName('tags')) {
      col.fields.add(new TextField({ name: 'tags' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cuidadores')
    const f = col.fields.getByName('tags')
    if (f) col.fields.remove(f)
    app.save(col)
  },
)
