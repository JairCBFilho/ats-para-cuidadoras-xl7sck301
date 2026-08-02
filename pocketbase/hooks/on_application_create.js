onRecordAfterCreateSuccess((e) => {
  var candidataId = e.record.getString('candidata')
  var vagaId = e.record.getString('vaga')
  var appId = e.record.id

  try {
    var candidata = $app.findRecordById('candidatas', candidataId)
    var vaga = $app.findRecordById('vagas', vagaId)
    var nome = candidata.getString('nome')
    var cargo = vaga.getString('cargo')

    var notifCol = $app.findCollectionByNameOrId('notificacoes')
    var notif = new Record(notifCol)
    notif.set('mensagem', 'Nova candidatura: ' + nome + ' para ' + cargo)
    notif.set('tipo', 'nova_candidatura')
    notif.set('lida', false)
    notif.set('candidata', candidataId)
    notif.set('vaga', vagaId)
    $app.save(notif)
  } catch (err) {
    $app.logger().error('failed to create notification', 'error', String(err))
  }

  var compatVal = e.record.get('compatibilidade') || 0
  if (compatVal && Number(compatVal) > 0) {
    return e.next()
  }

  try {
    var cData = {
      nome: candidata.getString('nome'),
      formacao: candidata.getString('formacao'),
      localizacao: candidata.getString('localizacao'),
      experiencia: candidata.getString('experiencia'),
      telefone: candidata.getString('telefone'),
      email: candidata.getString('email'),
      linkedin: candidata.getString('linkedin'),
      portfolio: candidata.getString('portfolio'),
    }
    var vData = {
      cargo: vaga.getString('cargo'),
      localizacao: vaga.getString('localizacao'),
      turno: vaga.getString('turno'),
      requisitos: vaga.getString('requisitos'),
    }
    var message =
      'Analise a compatibilidade desta candidata com esta vaga e retorne apenas o JSON:\n\nDADOS DA CANDIDATA:\n' +
      JSON.stringify(cData, null, 2) +
      '\n\nDADOS DA VAGA:\n' +
      JSON.stringify(vData, null, 2)

    var users = $app.findRecordsByFilter('users', "id != ''", 'created', 1, 0)
    if (users.length === 0) return e.next()
    var userId = users[0].id

    var result = $ai.agent('triagem-ia').chat({ user_id: userId, message: message })
    var content = (result.content || '').trim()
    var jsonMatch = content.match(/\{[\s\S]*\}/)
    var score = 0,
      justificativa = '',
      pontos_fortes = '',
      pontos_atencao = ''
    if (jsonMatch) {
      try {
        var parsed = JSON.parse(jsonMatch[0])
        score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)))
        justificativa = String(parsed.justificativa || '')
        pontos_fortes = String(parsed.pontos_fortes || '')
        pontos_atencao = String(parsed.pontos_atencao || '')
      } catch (_) {}
    }

    var appRecord = $app.findRecordById('applications', appId)
    appRecord.set('compatibilidade', score)
    appRecord.set('justificativa', justificativa)
    appRecord.set('pontos_fortes', pontos_fortes)
    appRecord.set('pontos_atencao', pontos_atencao)
    $app.saveNoValidate(appRecord)
  } catch (err) {
    $app.logger().error('auto-scoring failed', 'applicationId', appId, 'error', String(err))
  }

  return e.next()
}, 'applications')
