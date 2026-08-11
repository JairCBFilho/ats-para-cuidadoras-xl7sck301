/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('candidatas')

    // Campo de tags (texto, separado por virgulas) — espelha o campo de cuidadores
    // para permitir a sincronizacao bidirecional cuidador <-> candidata.
    if (!col.fields.getByName('tags')) {
      col.fields.add(new TextField({ name: 'tags' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('candidatas')
    const f = col.fields.getByName('tags')
    if (f) col.fields.remove(f)
    app.save(col)
  },
)
