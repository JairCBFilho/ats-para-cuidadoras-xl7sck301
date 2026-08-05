routerAdd(
  'POST',
  '/backend/v1/preselecionar',
  (e) => {
    const body = e.requestInfo().body || {}
    const vagaId = body.vaga_id
    if (!vagaId) return e.badRequestError('vaga_id e obrigatorio')

    const userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('Autenticacao necessaria')

    var THRESHOLD = 60
    if (body.threshold !== undefined && body.threshold !== null) {
      var parsedThreshold = Number(body.threshold)
      if (!isNaN(parsedThreshold) && parsedThreshold >= 0 && parsedThreshold <= 100) {
        THRESHOLD = parsedThreshold
      }
    }

    let vaga
    try {
      vaga = $app.findRecordById('vagas', vagaId)
    } catch (err) {
      return e.notFoundError('Vaga nao encontrada')
    }

    var cuidadores = $app.findRecordsByFilter(
      'cuidadores',
      "disponibilidade = 'disponível'",
      'created',
      500,
      0,
    )
    var total = cuidadores.length

    e.response.header().set('Content-Type', 'text/event-stream')
    e.response.header().set('Cache-Control', 'no-cache')

    $response.write(e, 'data: ' + JSON.stringify({ type: 'start', total: total }) + '\n\n')
    $response.flush(e)

    var vagaData = {
      cargo: vaga.getString('cargo'),
      localizacao: vaga.getString('localizacao'),
      turno: vaga.getString('turno'),
      requisitos: vaga.getString('requisitos'),
    }

    var promoted = 0

    for (var i = 0; i < cuidadores.length; i++) {
      var cuidador = cuidadores[i]
      var cuidadorData = {
        nome: cuidador.getString('nome'),
        formacao: cuidador.getString('formacao'),
        localizacao: cuidador.getString('localizacao'),
        experiencia: cuidador.getString('experiencia'),
        telefone: cuidador.getString('telefone'),
        email: cuidador.getString('email'),
        linkedin: cuidador.getString('linkedin'),
        portfolio: cuidador.getString('portfolio'),
        especialidades: cuidador.getString('especialidades'),
        turno: cuidador.getString('turno'),
        disponibilidade: cuidador.getString('disponibilidade'),
      }

      var message =
        'Analise a compatibilidade desta candidata com esta vaga e retorne apenas o JSON:\n\nDADOS DA CANDIDATA:\n' +
        JSON.stringify(cuidadorData, null, 2) +
        '\n\nDADOS DA VAGA:\n' +
        JSON.stringify(vagaData, null, 2)

      var score = 0,
        justificativa = '',
        pontos_fortes = '',
        pontos_atencao = ''
      try {
        var result = $ai.agent('triagem-ia').chat({ user_id: userId, message: message })
        var content = (result.content || '').trim()
        var jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            var parsed = JSON.parse(jsonMatch[0])
            score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)))
            justificativa = String(parsed.justificativa || '')
            pontos_fortes = String(parsed.pontos_fortes || '')
            pontos_atencao = String(parsed.pontos_atencao || '')
          } catch (_) {}
        }
      } catch (err) {
        $app.logger().error('preselecionar failed', 'cuidadorId', cuidador.id, 'error', String(err))
      }

      if (score >= THRESHOLD && cuidador.getString('email')) {
        var candidataId = ''
        try {
          var existingCand = $app.findFirstRecordByData(
            'candidatas',
            'email',
            cuidador.getString('email'),
          )
          candidataId = existingCand.id
        } catch (_) {
          try {
            var candidatasCol = $app.findCollectionByNameOrId('candidatas')
            var newCand = new Record(candidatasCol)
            newCand.set('nome', cuidador.getString('nome'))
            newCand.set('email', cuidador.getString('email'))
            newCand.set('formacao', cuidador.getString('formacao'))
            newCand.set('localizacao', cuidador.getString('localizacao'))
            newCand.set('experiencia', cuidador.getString('experiencia'))
            newCand.set('telefone', cuidador.getString('telefone'))
            newCand.set('origem', cuidador.getString('origem'))
            newCand.set('linkedin', cuidador.getString('linkedin'))
            newCand.set('portfolio', cuidador.getString('portfolio'))
            $app.save(newCand)
            candidataId = newCand.id
          } catch (err2) {
            $app.logger().error('preselecionar create candidata failed', 'error', String(err2))
          }
        }

        if (candidataId) {
          var existingApps = $app.findRecordsByFilter(
            'applications',
            "vaga = '" + vagaId + "' && candidata = '" + candidataId + "'",
            'created',
            1,
            0,
          )
          if (existingApps.length === 0) {
            try {
              var appsCol = $app.findCollectionByNameOrId('applications')
              var appRecord = new Record(appsCol)
              appRecord.set('vaga', vagaId)
              appRecord.set('candidata', candidataId)
              appRecord.set('etapa', 'Triagem')
              appRecord.set('compatibilidade', score)
              appRecord.set('justificativa', justificativa)
              appRecord.set('pontos_fortes', pontos_fortes)
              appRecord.set('pontos_atencao', pontos_atencao)
              $app.save(appRecord)
              promoted++
            } catch (err3) {
              $app.logger().error('preselecionar create application failed', 'error', String(err3))
            }
          }
        }
      }

      $response.write(
        e,
        'data: ' +
          JSON.stringify({
            type: 'progress',
            current: i + 1,
            total: total,
            cuidadorNome: cuidador.getString('nome'),
            score: score,
            promoted: promoted,
          }) +
          '\n\n',
      )
      $response.flush(e)
    }

    $response.write(
      e,
      'data: ' + JSON.stringify({ type: 'done', total: total, promoted: promoted }) + '\n\n',
    )
    $response.flush(e)
  },
  $apis.requireAuth(),
)
