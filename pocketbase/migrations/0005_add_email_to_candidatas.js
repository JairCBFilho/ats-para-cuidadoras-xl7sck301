migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('candidatas')
    if (!col.fields.getByName('email')) {
      col.fields.add(new EmailField({ name: 'email', required: true }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('candidatas')
    const field = col.fields.getByName('email')
    if (field) {
      col.fields.remove(field.getId())
      app.save(col)
    }
  },
)
