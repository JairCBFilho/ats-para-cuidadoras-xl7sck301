// Fila assincrona de scoring por IA.
// Cron por minuto: processa ate 10 candidaturas sem score (score_avaliado != true),
// chama o agente 'triagem-ia' e grava o resultado. O request do usuario nunca
// espera a IA — o frontend recebe o score via realtime quando o cron gravar.
cronAdd('triagem_ia_fila', '* * * * *', () => {
  var users = $app.findRecordsByFilter('users', "id != ''", 'created', 1, 0)
  if (users.length === 0) return
  var userId = users[0].id

  var pending = $app.findRecordsByFilter('applications', 'score_avaliado != true', 'created', 10, 0)
  if (pending.length === 0) return

  for (var i = 0; i < pending.length; i++) {
    var appRec = pending[i]
    try {
      var candidata = $app.findRecordById('candidatas', appRec.getString('candidata'))
      var vaga = $app.findRecordById('vagas', appRec.getString('vaga'))

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
      // Enriquece com tags do cuidador vinculado (por e-mail), se houver
      try {
        var cEmail = candidata.getString('email')
        if (cEmail) {
          var cuidadoresRel = $app.findRecordsByFilter(
            'cuidadores',
            'email = {:email}',
            'created',
            1,
            0,
            { email: cEmail },
          )
          if (cuidadoresRel.length > 0) {
            cData.tags = cuidadoresRel[0].getString('tags')
          }
        }
      } catch (_) {
        /* tags sao opcionais */
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

      var score = 0,
        justificativa = '',
        pontos_fortes = '',
        pontos_atencao = ''
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
        } catch (_) {
          /* resposta fora do formato — score 0 */
        }
      }

      appRec.set('compatibilidade', score)
      appRec.set('justificativa', justificativa)
      appRec.set('pontos_fortes', pontos_fortes)
      appRec.set('pontos_atencao', pontos_atencao)
      appRec.set('score_avaliado', true)
      $app.saveNoValidate(appRec)
      $app
        .logger()
        .info('triagem-ia fila: score gravado', 'applicationId', appRec.id, 'score', score)
    } catch (err) {
      $app
        .logger()
        .error('triagem-ia fila falhou', 'applicationId', appRec.id, 'error', String(err))
      // Marca como avaliado mesmo em falha para nao travar a fila — score 0
      try {
        appRec.set('score_avaliado', true)
        $app.saveNoValidate(appRec)
      } catch (_) {
        /* segue */
      }
    }
  }
})
