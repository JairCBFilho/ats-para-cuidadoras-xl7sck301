// Extracao de dados de curriculo em PDF via agente de IA.
// POST /backend/v1/extract-curriculo
// Body: { content: "<base64 do PDF em binario>" }
// Retorna JSON estruturado com os campos extraidos pelo agente extracao-curriculo.
//
// Observacao: o JSVM do PocketBase nao expoe atob/btoa nem o pacote Buffer do Node.
// O texto do PDF e extraido de forma simples a partir do binario (strings entre
// parenteses dos operadores Tj/TJ) e enviado ao agente de IA.
//
// IMPORTANTE (scoping do JSVM): o PocketBase executa callbacks de routerAdd em um
// pool de VMs separado do que registra o hook. Declaracoes de topo (function/var)
// NAO sao acessiveis dentro do callback em runtime. Por isso TODA a logica —
// incluindo as funcoes auxiliares base64Decode e extractPdfText — deve estar
// inline dentro do corpo do callback.

routerAdd(
  'POST',
  '/backend/v1/extract-curriculo',
  (e) => {
    // Decodifica base64 para string binaria.
    var base64Decode = function (b64) {
      b64 = String(b64).replace(/[^A-Za-z0-9+/=]/g, '')
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      var str = ''
      var i = 0
      while (i < b64.length) {
        var a = chars.indexOf(b64.charAt(i++))
        var b = chars.indexOf(b64.charAt(i++))
        var c = chars.indexOf(b64.charAt(i++))
        var d = chars.indexOf(b64.charAt(i++))
        var n = (a << 18) | (b << 12) | (c << 6) | d
        str += String.fromCharCode((n >> 16) & 0xff)
        if (c !== 64) str += String.fromCharCode((n >> 8) & 0xff)
        if (d !== 64) str += String.fromCharCode(n & 0xff)
      }
      return str
    }

    // Extrai texto legivel do PDF (strings entre parenteses dos operadores Tj/TJ).
    var extractPdfText = function (raw) {
      var out = ''
      var re = /\(((?:\\.|[^()\\])*)\)/g
      var m
      while ((m = re.exec(raw)) !== null) {
        var s = m[1]
        s = s
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
        if (s.length >= 1) {
          var printable = 0
          for (var i = 0; i < s.length; i++) {
            var code = s.charCodeAt(i)
            if ((code >= 32 && code < 127) || code === 10 || code === 13) printable++
          }
          if (printable / s.length > 0.5) out += s + ' '
        }
      }
      return out.replace(/\s+/g, ' ').trim()
    }

    var body = e.requestInfo().body || {}
    var contentB64 = body.content
    if (!contentB64) {
      return e.badRequestError('Conteudo do PDF nao enviado (campo "content" em base64)')
    }

    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('Autenticacao necessaria')

    var binaryStr = ''
    try {
      binaryStr = base64Decode(String(contentB64))
    } catch (err) {
      return e.json(400, { error: 'PDF invalido: falha ao decodificar base64' })
    }

    if (!binaryStr) {
      return e.json(400, { error: 'PDF invalido: conteudo vazio apos decodificacao' })
    }

    var extractedText = extractPdfText(binaryStr)

    if (!extractedText || extractedText.trim().length < 10) {
      return e.json(422, {
        error:
          'Nao foi possivel extrair texto do PDF. O arquivo pode ser imagem escaneada ou estar protegido.',
      })
    }

    // Chama o agente de IA para extrair dados estruturados.
    try {
      var message =
        'Extraia os dados estruturados deste curriculo de cuidadora de idosos e retorne APENAS o JSON conforme o formato definido:\n\n' +
        extractedText

      var result = $ai.agent('extracao-curriculo').chat({ user_id: userId, message: message })
      var content = (result.content || '').trim()

      // Remove blocos de codigo markdown se presentes.
      if (content.indexOf('```') !== -1) {
        content = content
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()
      }

      // Tenta extrair o JSON da resposta.
      var parsed = null
      var jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch (_) {}
      }

      var fields = [
        'nome',
        'email',
        'telefone',
        'cpf',
        'data_nascimento',
        'endereco',
        'bairro',
        'cidade',
        'uf',
        'formacao',
        'curso_cuidador',
        'tempo_experiencia',
        'experiencia_ilp',
        'outros_cursos',
        'referencias',
        'disponibilidade',
        'turno',
      ]

      var out = {}
      if (!parsed) {
        for (var i = 0; i < fields.length; i++) out[fields[i]] = ''
        out._raw = content
        return e.json(200, out)
      }

      for (var j = 0; j < fields.length; j++) {
        out[fields[j]] = String(parsed[fields[j]] || '')
      }
      return e.json(200, out)
    } catch (err) {
      if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      }
      if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
        var status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Agente indisponivel' : err.message,
        })
      }
      if (typeof SkipAiError !== 'undefined' && err instanceof SkipAiError) {
        var status2 = err.status || 502
        return e.json(status2, { error: 'Falha ao extrair dados do curriculo' })
      }
      $app.logger().error('extract-curriculo failed', 'error', String(err))
      return e.json(500, { error: 'Erro inesperado ao extrair dados' })
    }
  },
  $apis.requireAuth(),
)
