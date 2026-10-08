migrate(
  (app) => {
    // Backfill de data_cadastro em branco na tabela cuidadores.
    // Preenche com a data de criacao real do registro (campo created).
    // Idempotente: so altera registros onde data_cadastro for nulo ou string vazia.
    try {
      app
        .db()
        .newQuery(
          "UPDATE cuidadores SET data_cadastro = created WHERE data_cadastro IS NULL OR data_cadastro = ''",
        )
        .execute()
    } catch (err) {
      console.log('Erro ao executar backfill de data_cadastro em cuidadores:', err)
      throw err
    }
  },
  (app) => {
    // Reversao nao necessaria para preservar integridade dos dados existentes.
  },
)
