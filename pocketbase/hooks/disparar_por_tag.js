// Disparo de comunicacao por tag.
// POST /backend/v1/disparar-por-tag
// Body: { tags: string[], canal: 'email' | 'whatsapp', templateId: string }
// - Para email: envia automaticamente via $app.newMailClient() e retorna { enviados, total, erros }
// - Para whatsapp: retorna { results: [{ nome, telefone, link }] } para o frontend abrir os links
routerAdd(
  'POST',
  '/backend/v1/disparar-por-tag',
  (e) => {
    var body = e.requestInfo().body || {}
    var tags = body.tags || []
    var canal = body.canal
    var templateId = body.templateId

    if (!tags.length || !canal || !templateId)
      return e.badRequestError('tags, canal e templateId sao obrigatorios')

    if (canal !== 'email' && canal !== 'whatsapp')
      return e.badRequestError('canal deve ser email ou whatsapp')

    // Carrega o template
    var template = null
    try {
      template = $app.findRecordById('email_templates', templateId)
    } catch (err) {
      return e.notFoundError('Template nao encontrado')
    }
    var assuntoTpl = template.getString('assunto')
    var corpoTpl = template.getString('corpo')

    // Busca todos os cuidadores
    var cuidadores = $app.findRecordsByFilter('cuidadores', "id != ''", 'nome', 2000, 0)

    // Filtra cuidadores que possuem pelo menos uma das tags selecionadas.
    // As tags do cuidador sao armazenadas como string separada por virgulas.
    var tagsLower = {}
    for (var t = 0; t < tags.length; t++) {
      tagsLower[String(tags[t]).toLowerCase()] = true
    }

    var alvo = []
    for (var i = 0; i < cuidadores.length; i++) {
      var c = cuidadores[i]
      var rawTags = c.getString('tags')
      if (!rawTags) continue
      var parts = rawTags.split(',')
      var tem = false
      for (var p = 0; p < parts.length; p++) {
        var tag = parts[p].trim().toLowerCase()
        if (tag && tagsLower[tag]) {
          tem = true
          break
        }
      }
      if (tem) alvo.push(c)
    }

    function substituir(texto, nome) {
      return String(texto || '')
        .replace(/{nome_candidata}/g, nome)
        .replace(/{nome_vaga}/g, '')
        .replace(/{cargo}/g, '')
        .replace(/{etapa}/g, '')
        .replace(/{data_entrevista}/g, 'data a confirmar')
    }

    if (canal === 'email') {
      var enviados = 0
      var erros = []
      for (var j = 0; j < alvo.length; j++) {
        var cuid = alvo[j]
        var nome = cuid.getString('nome')
        var email = cuid.getString('email')
        if (!email) {
          erros.push({ nome: nome, error: 'sem email' })
          continue
        }
        try {
          var assunto = substituir(assuntoTpl, nome)
          var corpo = substituir(corpoTpl, nome)
          var client = $app.newMailClient()
          client.send({
            from: { name: 'Lazuli ATS', address: 'noreply@lazuliats.com' },
            to: [{ name: nome, address: email }],
            subject: assunto,
            html: corpo,
          })
          enviados++
        } catch (err) {
          erros.push({ nome: nome, error: String(err) })
        }
      }
      return e.json(200, { enviados: enviados, total: alvo.length, erros: erros })
    }

    // WhatsApp: retorna a lista de links para o frontend abrir
    var results = []
    for (var k = 0; k < alvo.length; k++) {
      var cuid2 = alvo[k]
      var nome2 = cuid2.getString('nome')
      var telefone = cuid2.getString('telefone') || cuid2.getString('celular') || ''
      var phone = String(telefone).replace(/[^\d]/g, '')
      if (!phone) continue
      var corpo2 = substituir(corpoTpl, nome2)
      var link = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(corpo2)
      results.push({ nome: nome2, telefone: telefone, link: link })
    }
    return e.json(200, { results: results, total: alvo.length })
  },
  $apis.requireAuth(),
)
