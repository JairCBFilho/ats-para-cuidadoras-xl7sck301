migrate(
  (app) => {
    // Adiciona a opção "Formulário público" ao select `origem` da collection `cuidadores`
    // (e também da `candidatas`, para manter consistência visual no Banco de Talentos).
    var cuidadoresCol = app.findCollectionByNameOrId('cuidadores')
    var origemCuidadores = cuidadoresCol.fields.getByName('origem')
    if (origemCuidadores && origemCuidadores.values) {
      var vals = origemCuidadores.values || []
      if (vals.indexOf('Formulário público') === -1) {
        origemCuidadores.values = vals.concat(['Formulário público'])
      }
    }
    app.save(cuidadoresCol)

    var candidatasCol = app.findCollectionByNameOrId('candidatas')
    var origemCandidatas = candidatasCol.fields.getByName('origem')
    if (origemCandidatas && origemCandidatas.values) {
      var valsC = origemCandidatas.values || []
      if (valsC.indexOf('Formulário público') === -1) {
        origemCandidatas.values = valsC.concat(['Formulário público'])
      }
    }
    app.save(candidatasCol)
  },
  (app) => {
    var cuidadoresCol = app.findCollectionByNameOrId('cuidadores')
    var origemCuidadores = cuidadoresCol.fields.getByName('origem')
    if (origemCuidadores && origemCuidadores.values) {
      origemCuidadores.values = (origemCuidadores.values || []).filter(function (v) {
        return v !== 'Formulário público'
      })
    }
    app.save(cuidadoresCol)

    var candidatasCol = app.findCollectionByNameOrId('candidatas')
    var origemCandidatas = candidatasCol.fields.getByName('origem')
    if (origemCandidatas && origemCandidatas.values) {
      origemCandidatas.values = (origemCandidatas.values || []).filter(function (v) {
        return v !== 'Formulário público'
      })
    }
    app.save(candidatasCol)
  },
)
