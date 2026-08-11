// Sincronizacao bidirecional entre cuidadores e candidatas.
// Quando um cuidador e atualizado, reflete nos campos equivalentes da candidata
// vinculada (por email). Quando uma candidata e atualizada, reflete no cuidador
// vinculado (por email) — apenas para campos que fazem sentido.
//
// A sincronizacao e idempotente e nao cria loops: so escreve no destino os
// campos cujo valor difere do atual. Apos a gravacao, o destino passa a ter os
// mesmos valores da origem, de modo que o hook reverso (disparado por essa
// gravacao) nao encontra diferencas e nao grava novamente.

onRecordAfterUpdateSuccess((e) => {
  var record = e.record
  var email = record.getString('email')
  if (!email) return e.next()

  try {
    var candidata = null
    try {
      var found = $app.findRecordsByFilter(
        'candidatas',
        "email = '" + email.replace(/'/g, "''") + "'",
        'created',
        1,
        0,
      )
      if (found.length > 0) candidata = found[0]
    } catch (_) {}

    if (!candidata) return e.next()

    var dirty = false
    var map = [
      ['nome', 'nome'],
      ['email', 'email'],
      ['telefone', 'telefone'],
      ['tags', 'tags'],
      ['disponibilidade', 'disponibilidade'],
      ['turno', 'turno'],
      ['especialidades', 'especialidades'],
      ['localizacao', 'localizacao'],
      ['formacao', 'formacao'],
      ['experiencia', 'experiencia'],
    ]
    for (var i = 0; i < map.length; i++) {
      var srcField = map[i][0]
      var dstField = map[i][1]
      // O campo deve existir tanto na origem (cuidador) quanto no destino (candidata)
      if (!record.collection().fields.getByName(srcField)) continue
      if (!candidata.collection().fields.getByName(dstField)) continue
      var newVal = record.getString(srcField)
      var oldVal = candidata.getString(dstField)
      if (newVal !== oldVal) {
        candidata.set(dstField, newVal)
        dirty = true
      }
    }
    if (dirty) {
      $app.save(candidata)
    }
  } catch (err) {
    $app.logger().error('sync cuidador->candidata failed', 'error', String(err))
  }
  return e.next()
}, 'cuidadores')

onRecordAfterUpdateSuccess((e) => {
  var record = e.record
  var email = record.getString('email')
  if (!email) return e.next()

  try {
    var cuidador = null
    try {
      var found = $app.findRecordsByFilter(
        'cuidadores',
        "email = '" + email.replace(/'/g, "''") + "'",
        'created',
        1,
        0,
      )
      if (found.length > 0) cuidador = found[0]
    } catch (_) {}

    if (!cuidador) return e.next()

    var dirty = false
    // Caminho inverso: apenas campos que fazem sentido
    var map = [
      ['nome', 'nome'],
      ['email', 'email'],
      ['telefone', 'telefone'],
      ['tags', 'tags'],
    ]
    for (var i = 0; i < map.length; i++) {
      var srcField = map[i][0]
      var dstField = map[i][1]
      // O campo deve existir tanto na origem (candidata) quanto no destino (cuidador)
      if (!record.collection().fields.getByName(srcField)) continue
      if (!cuidador.collection().fields.getByName(dstField)) continue
      var newVal = record.getString(srcField)
      var oldVal = cuidador.getString(dstField)
      if (newVal !== oldVal) {
        cuidador.set(dstField, newVal)
        dirty = true
      }
    }
    if (dirty) {
      $app.save(cuidador)
    }
  } catch (err) {
    $app.logger().error('sync candidata->cuidador failed', 'error', String(err))
  }
  return e.next()
}, 'candidatas')
