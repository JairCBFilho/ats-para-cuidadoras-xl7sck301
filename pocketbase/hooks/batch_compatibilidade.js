routerAdd(
  'POST',
  '/backend/v1/compatibilidade/batch',
  (e) => {
    const body = e.requestInfo().body || {}
    const vagaId = body.vagaId
    if (!vagaId) return e.badRequestError('vagaId e obrigatorio')
    const userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('Autenticacao necessaria')

    let vaga
    try {
      vaga = $app.findRecordById('vagas', vagaId)
    } catch (err) {
      return e.notFoundError('Vaga nao encontrada')
    }

    const candidatas = $app.findRecordsByFilter('candidatas', "id != ''", 'created', 500, 0)
    const total = candidatas.length

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

    for (var i = 0; i < candidatas.length; i++) {
      var candidata = candidatas[i]
      var candidataData = {
        nome: candidata.getString('nome'),
        formacao: candidata.getString('formacao'),
        localizacao: candidata.getString('localizacao'),
        experiencia: candidata.getString('experiencia'),
        telefone: candidata.getString('telefone'),
        email: candidata.getString('email'),
        linkedin: candidata.getString('linkedin'),
        portfolio: candidata.getString('portfolio'),
      }
      var message =
        'Analise a compatibilidade desta candidata com esta vaga e retorne apenas o JSON:\n\nDADOS DA CANDIDATA:\n' +
        JSON.stringify(candidataData, null, 2) +
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
        $app
          .logger()
          .error('batch compat failed', 'candidataId', candidata.id, 'error', String(err))
      }

      var appRecord
      var existing = $app.findRecordsByFilter(
        'applications',
        "vaga = '" + vagaId + "' && candidata = '" + candidata.id + "'",
        'created',
        1,
        0,
      )
      if (existing.length > 0) {
        appRecord = existing[0]
      } else {
        var appsCol = $app.findCollectionByNameOrId('applications')
        appRecord = new Record(appsCol)
        appRecord.set('vaga', vagaId)
        appRecord.set('candidata', candidata.id)
        appRecord.set('etapa', 'Triagem')
      }
      appRecord.set('compatibilidade', score)
      appRecord.set('justificativa', justificativa)
      appRecord.set('pontos_fortes', pontos_fortes)
      appRecord.set('pontos_atencao', pontos_atencao)
      try {
        $app.save(appRecord)
      } catch (_) {}

      $response.write(
        e,
        'data: ' +
          JSON.stringify({
            type: 'progress',
            current: i + 1,
            total: total,
            candidataId: candidata.id,
            candidataNome: candidata.getString('nome'),
            score: score,
          }) +
          '\n\n',
      )
      $response.flush(e)
    }

    $response.write(e, 'data: ' + JSON.stringify({ type: 'done', total: total }) + '\n\n')
    $response.flush(e)
  },
  $apis.requireAuth(),
)
