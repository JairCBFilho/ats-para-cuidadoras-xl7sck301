migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cuidadores')

    if (!col.fields.getByName('documentos_pdf')) {
      col.fields.add(
        new FileField({
          name: 'documentos_pdf',
          maxSelect: 10,
          maxSize: 10485760, // 10MB por arquivo
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cuidadores')
    const f = col.fields.getByName('documentos_pdf')
    if (f) {
      col.fields.remove(f)
      app.save(col)
    }
  },
)
