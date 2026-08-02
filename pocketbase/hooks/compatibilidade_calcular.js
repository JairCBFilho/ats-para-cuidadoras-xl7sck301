routerAdd(
  'POST',
  '/backend/v1/compatibilidade/calcular',
  (e) => {
    const body = e.requestInfo().body || {}
    const candidataId = body.candidataId
    const vagaId = body.vagaId
    if (!candidataId || !vagaId) return e.badRequestError('candidataId e vagaId sao obrigatorios')

    let candidata
    try {
      candidata = $app.findRecordById('candidatas', candidataId)
    } catch (err) {
      return e.notFoundError('Candidata nao encontrada')
    }
    let vaga
    try {
      vaga = $app.findRecordById('vagas', vagaId)
    } catch (err) {
      return e.notFoundError('Vaga nao encontrada')
    }

    const candidataData = {
      nome: candidata.getString('nome'),
      formacao: candidata.getString('formacao'),
      localizacao: candidata.getString('localizacao'),
      experiencia: candidata.getString('experiencia'),
      telefone: candidata.getString('telefone'),
      email: candidata.getString('email'),
      linkedin: candidata.getString('linkedin'),
      portfolio: candidata.getString('portfolio'),
    }
    const vagaData = {
      cargo: vaga.getString('cargo'),
      localizacao: vaga.getString('localizacao'),
      turno: vaga.getString('turno'),
      requisitos: vaga.getString('requisitos'),
    }

    const message =
      'Analise a compatibilidade desta candidata com esta vaga e retorne apenas o JSON:\n\nDADOS DA CANDIDATA:\n' +
      JSON.stringify(candidataData, null, 2) +
      '\n\nDADOS DA VAGA:\n' +
      JSON.stringify(vagaData, null, 2)

    try {
      const userId = e.auth ? e.auth.id : ''
      if (!userId) return e.unauthorizedError('Autenticacao necessaria')
      const result = $ai.agent('triagem-ia').chat({ user_id: userId, message: message })
      let content = (result.content || '').trim()
      let score = 0,
        justificativa = '',
        pontos_fortes = '',
        pontos_atencao = ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)))
          justificativa = String(parsed.justificativa || '')
          pontos_fortes = String(parsed.pontos_fortes || '')
          pontos_atencao = String(parsed.pontos_atencao || '')
        } catch (_) {}
      }
      return e.json(200, { score, justificativa, pontos_fortes, pontos_atencao })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      if (err instanceof SkipAiError)
        return e.json(502, { error: 'Falha ao calcular compatibilidade' })
      throw err
    }
  },
  $apis.requireAuth(),
)
