migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cuidadores')

    // Novos campos para importação CSV
    col.fields.add(new NumberField({ name: 'codigo', onlyInt: false }))
    col.fields.add(new DateField({ name: 'data_cadastro' }))
    col.fields.add(new DateField({ name: 'data_contato' }))
    col.fields.add(new DateField({ name: 'nascimento' }))
    col.fields.add(new TextField({ name: 'endereco' }))
    col.fields.add(new TextField({ name: 'bairro' }))
    col.fields.add(new TextField({ name: 'cidade' }))
    col.fields.add(new TextField({ name: 'uf' }))
    col.fields.add(new TextField({ name: 'cep' }))
    col.fields.add(new TextField({ name: 'celular' }))
    col.fields.add(new TextField({ name: 'sexo' }))
    col.fields.add(new TextField({ name: 'identidade' }))
    col.fields.add(new TextField({ name: 'cpf' }))
    col.fields.add(new TextField({ name: 'curso_cuidador' }))
    col.fields.add(new TextField({ name: 'carga_horaria_curso' }))
    col.fields.add(new TextField({ name: 'tempo_experiencia' }))
    col.fields.add(new TextField({ name: 'referencias' }))
    col.fields.add(new TextField({ name: 'outros_cursos_experiencias' }))
    col.fields.add(new TextField({ name: 'experiencia_ilp' }))
    col.fields.add(new TextField({ name: 'vacina_covid' }))
    col.fields.add(new TextField({ name: 'restricao_fisica' }))
    col.fields.add(new TextField({ name: 'disponibilidade_horario' }))
    col.fields.add(new TextField({ name: 'inicio_imediato' }))
    col.fields.add(new TextField({ name: 'certific' }))
    col.fields.add(new TextField({ name: 'declaracao' }))

    app.save(col)

    // Limpa duplicatas de cpf antes de criar o índice único.
    // Mantém o registro mais antigo (menor id) por cpf não-vazio.
    app
      .db()
      .newQuery(
        "DELETE FROM cuidadores WHERE id NOT IN (SELECT MIN(id) FROM cuidadores WHERE cpf != '' GROUP BY cpf) AND cpf != ''",
      )
      .execute()

    col.addIndex('idx_cuidadores_cpf', true, 'cpf', "cpf != ''")
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cuidadores')
    col.removeIndex('idx_cuidadores_cpf')
    ;[
      'codigo',
      'data_cadastro',
      'data_contato',
      'nascimento',
      'endereco',
      'bairro',
      'cidade',
      'uf',
      'cep',
      'celular',
      'sexo',
      'identidade',
      'cpf',
      'curso_cuidador',
      'carga_horaria_curso',
      'tempo_experiencia',
      'referencias',
      'outros_cursos_experiencias',
      'experiencia_ilp',
      'vacina_covid',
      'restricao_fisica',
      'disponibilidade_horario',
      'inicio_imediato',
      'certific',
      'declaracao',
    ].forEach((name) => {
      const f = col.fields.getByName(name)
      if (f) col.fields.remove(f)
    })
    app.save(col)
  },
)
