migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('email_templates')
    if (!col.fields.getByName('canal')) {
      col.fields.add(
        new SelectField({
          name: 'canal',
          required: true,
          values: ['email', 'whatsapp'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('anexo')) {
      col.fields.add(
        new FileField({
          name: 'anexo',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    col.removeIndex('idx_email_templates_etapa')
    app.save(col)

    var existing = app.findRecordsByFilter('email_templates', "id != ''", 'created', 100, 0)
    for (var i = 0; i < existing.length; i++) {
      if (!existing[i].getString('canal')) {
        existing[i].set('canal', 'email')
        app.save(existing[i])
      }
    }
    col.addIndex('idx_email_templates_etapa_canal', true, 'etapa,canal', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('email_templates')
    col.removeIndex('idx_email_templates_etapa_canal')
    const canalField = col.fields.getByName('canal')
    if (canalField) col.fields.remove(canalField)
    const anexoField = col.fields.getByName('anexo')
    if (anexoField) col.fields.remove(anexoField)
    col.addIndex('idx_email_templates_etapa', true, 'etapa', '')
    app.save(col)
  },
)
