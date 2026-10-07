routerAdd('POST', '/backend/v1/cadastro-publico', (e) => {
  // ===== Cadastro público de cuidadoras com token =====
  // Rota pública (sem autenticação). Valida token contra o registro em `configuracoes`.
  // Rate limiting: máximo 5 envios por minuto por IP (via $app.store()).
  // CPF existente com o MESMO e-mail (ou placeholder de importação) -> atualiza.
  // CPF existente com e-mail DIFERENTE -> cria DUPLICATA marcada com a tag
  // "duplicata" para revisão manual no Banco de Talentos (o original fica intacto).
  // Resposta genérica sempre que o token for válido.

  // Aceita tanto multipart (com arquivos) quanto JSON puro.
  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  // --- Validação do token contra o registro em `configuracoes` ---
  var token = String(body.token || '').trim()
  if (!token) {
    return e.json(403, { error: 'Acesso não autorizado.' })
  }

  var expectedToken = ''
  try {
    var configs = $app.findRecordsByFilter('configuracoes', "id != ''", 'created', 1, 0)
    if (configs.length > 0) {
      expectedToken = (configs[0].getString('token_cadastro') || '').trim()
    }
  } catch (_) {
    expectedToken = ''
  }
  if (!expectedToken || token !== expectedToken) {
    return e.json(403, { error: 'Acesso não autorizado.' })
  }

  // --- Rate limiting via $app.store() (in-memory, 60s) ---
  var ip = e.realIP() || 'unknown'
  var rlKey = 'cadastro_pub_rl:' + ip
  var store = $app.store()
  var now = Date.now()
  var windowMs = 60 * 1000
  var maxReqs = 5
  var entry = null
  try {
    entry = store.get(rlKey)
  } catch (_) {
    entry = null
  }
  if (!entry || typeof entry !== 'object') {
    entry = { count: 0, first: now }
  }
  if (now - entry.first > windowMs) {
    entry = { count: 0, first: now }
  }
  entry.count = entry.count + 1
  store.set(rlKey, entry)
  if (entry.count > maxReqs) {
    return e.json(429, { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' })
  }

  // --- Helpers inline ---
  var onlyDigits = function (s) {
    if (s === undefined || s === null) return ''
    return String(s).replace(/[^\d]/g, '')
  }

  var isValidCPF = function (cpf) {
    cpf = onlyDigits(cpf)
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false
    var calcCheck = function (slice, weights) {
      var sum = 0
      for (var i = 0; i < slice.length; i++) {
        sum += parseInt(slice[i], 10) * weights[i]
      }
      var rem = (sum * 10) % 11
      if (rem === 10) rem = 0
      return rem
    }
    var d1 = calcCheck(cpf.substring(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
    if (d1 !== parseInt(cpf[9], 10)) return false
    var d2 = calcCheck(cpf.substring(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
    if (d2 !== parseInt(cpf[10], 10)) return false
    return true
  }

  var str = function (v, max) {
    if (v === undefined || v === null) return ''
    var s = String(v).trim()
    if (max && s.length > max) s = s.substring(0, max)
    return s
  }

  // --- Campos internos proibidos no envio público ---
  var FORBIDDEN = {
    codigo: true,
    data_cadastro: true,
    data_contato: true,
    certific: true,
    declaracao: true,
    tags: true,
    origem: true,
  }

  // --- Validação de campos obrigatórios ---
  var nome = str(body.nome)
  var email = str(body.email).toLowerCase()
  var telefone = str(body.telefone)
  var cpf = onlyDigits(body.cpf)

  var missing = []
  if (!nome) missing.push('nome')
  if (!email) missing.push('email')
  if (!telefone) missing.push('telefone')
  if (!cpf) missing.push('cpf')
  if (missing.length > 0) {
    return e.json(400, { error: 'Campos obrigatórios ausentes: ' + missing.join(', ') + '.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return e.json(400, { error: 'E-mail inválido.' })
  }

  if (!isValidCPF(cpf)) {
    return e.json(400, { error: 'CPF inválido.' })
  }

  // --- Coleta dos campos permitidos ---
  var allowedFields = [
    'nome',
    'email',
    'telefone',
    'cpf',
    'data_nascimento',
    'endereco',
    'bairro',
    'cidade',
    'uf',
    'cep',
    'celular',
    'sexo',
    'identidade',
    'formacao',
    'curso_cuidador',
    'carga_horaria_curso',
    'tempo_experiencia',
    'referencias',
    'outros_cursos_experiencias',
    'experiencia_ilp',
    'vacina_covid',
    'restricao_fisica',
    'disponibilidade_horario',
    'inicio_imediato',
    'disponibilidade',
    'turno',
    'especialidades',
    'linkedin',
    'portfolio',
    'experiencia',
    'localizacao',
    'nascimento',
  ]

  var data = {}
  for (var i = 0; i < allowedFields.length; i++) {
    var k = allowedFields[i]
    if (FORBIDDEN[k]) continue
    if (body[k] !== undefined && body[k] !== null && String(body[k]).trim() !== '') {
      data[k] = str(body[k], 2000)
    }
  }

  data.nome = nome
  data.email = email
  data.telefone = telefone
  data.cpf = cpf

  // Normaliza data_nascimento -> nascimento
  if (data.data_nascimento && !data.nascimento) {
    var dn = onlyDigits(data.data_nascimento)
    if (dn.length === 8) {
      data.nascimento = dn.slice(4) + '-' + dn.slice(2, 4) + '-' + dn.slice(0, 2)
    } else if (/^\d{4}-\d{2}-\d{2}/.test(data.data_nascimento)) {
      data.nascimento = String(data.data_nascimento).slice(0, 10)
    }
  }
  delete data.data_nascimento

  if (!data.localizacao) {
    var locParts = []
    if (data.cidade) locParts.push(data.cidade)
    if (data.uf) locParts.push(data.uf)
    if (locParts.length > 0) data.localizacao = locParts.join('/')
  }

  if (data.disponibilidade) {
    var dl = String(data.disponibilidade).toLowerCase()
    data.disponibilidade = dl.indexOf('indispon') !== -1 ? 'indisponível' : 'disponível'
  }

  if (data.turno) {
    var tu = String(data.turno)
    if (tu !== '12h' && tu !== '24h') {
      data.turno = tu.indexOf('24') !== -1 ? '24h' : '12h'
    }
  }

  // --- Uploads opcionais (foto, currículo e PDFs adicionais) via multipart ---
  var fotoFiles = []
  var curriculoFiles = []
  var pdfFiles = []
  try {
    fotoFiles = e.findUploadedFiles('foto') || []
  } catch (_) {}
  try {
    curriculoFiles = e.findUploadedFiles('curriculo') || []
  } catch (_) {}
  try {
    // Pode vir como 'documentos_pdf' ou 'documentos'
    var pdfList1 = e.findUploadedFiles('documentos_pdf') || []
    var pdfList2 = e.findUploadedFiles('documentos') || []
    pdfFiles = pdfList1.concat(pdfList2)
  } catch (_) {}

  // Filtra apenas arquivos PDF
  var validPdfFiles = []
  for (var f = 0; f < pdfFiles.length; f++) {
    var fileObj = pdfFiles[f]
    var fname = ''
    try {
      fname = String(fileObj.name || '').toLowerCase()
    } catch (_) {
      fname = ''
    }
    if (fname.endsWith('.pdf')) {
      validPdfFiles.push(fileObj)
    }
  }

  // --- Regra de CPF (decisão do Jair, 26/09) ---
  var col = $app.findCollectionByNameOrId('cuidadores')
  var record = null
  var isDuplicate = false
  try {
    var found = $app.findRecordsByFilter('cuidadores', 'cpf = {:cpf}', 'created', 1, 0, {
      cpf: cpf,
    })
    if (found.length > 0) {
      var existingEmail = String(found[0].getString('email') || '')
        .trim()
        .toLowerCase()
      var isPlaceholder = existingEmail.indexOf('@importacao.local') !== -1
      if (existingEmail === email || isPlaceholder) {
        // Mesma pessoa (ou cadastro importado sem e-mail real) -> atualiza
        record = found[0]
      } else {
        // E-mail diferente -> duplicata para revisão; original intocado
        isDuplicate = true
        $app
          .logger()
          .warn(
            'cadastro-publico: CPF existente com e-mail diferente — duplicata criada',
            'cpf',
            cpf.substring(0, 3) + '***' + cpf.substring(9),
            'email_novo',
            email,
          )
      }
    }
  } catch (_) {
    record = null
  }

  var isNew = false
  if (!record) {
    record = new Record(col)
    isNew = true
  }

  try {
    var keys = Object.keys(data)
    for (var j = 0; j < keys.length; j++) {
      var field = keys[j]
      if (FORBIDDEN[field]) continue
      record.set(field, data[field])
    }
    if (fotoFiles.length > 0) {
      record.set('foto', fotoFiles[0])
    }
    if (curriculoFiles.length > 0) {
      record.set('curriculo', curriculoFiles[0])
    }

    // Anexo de PDFs: adiciona aos existentes sem substituir
    if (validPdfFiles.length > 0) {
      var existingPdfs = []
      try {
        existingPdfs = record.getStringSlice('documentos_pdf') || []
      } catch (_) {
        try {
          var rawPdfs = record.get('documentos_pdf')
          if (Array.isArray(rawPdfs)) existingPdfs = rawPdfs
          else if (rawPdfs) existingPdfs = [String(rawPdfs)]
        } catch (_) {
          existingPdfs = []
        }
      }
      var combinedPdfs = existingPdfs.concat(validPdfFiles)
      record.set('documentos_pdf', combinedPdfs)
    }

    if (isNew) {
      record.set('origem', 'Formulário público')
      record.set('consentimento_lgpd', true)
      record.set('consentimento_data', new Date().toISOString().replace('T', ' '))
    } else {
      // 2. Tag automática "Atualizado" quando atualiza registro existente
      var prevTags = String(record.getString('tags') || '')
      var tagList = prevTags
        .split(',')
        .map(function (t) {
          return t.trim()
        })
        .filter(function (t) {
          return t.length > 0
        })

      var hasAtualizado = false
      for (var ti = 0; ti < tagList.length; ti++) {
        if (tagList[ti].toLowerCase() === 'atualizado') {
          hasAtualizado = true
          break
        }
      }
      if (!hasAtualizado) {
        tagList.push('Atualizado')
        record.set('tags', tagList.join(', '))
      }
    }

    if (isDuplicate) {
      var prevTagsDup = String(record.getString('tags') || '')
      if (prevTagsDup.indexOf('duplicata') === -1) {
        record.set('tags', prevTagsDup ? prevTagsDup + ', duplicata' : 'duplicata')
      }
    }
    $app.save(record)
  } catch (err) {
    $app
      .logger()
      .error(
        'cadastro-publico erro ao salvar',
        'cpf',
        cpf.substring(0, 3) + '***' + cpf.substring(9),
        'error',
        String(err),
      )
    return e.json(400, { error: 'Não foi possível processar o cadastro. Verifique os dados.' })
  }

  // Resposta genérica: nunca revela se o CPF já existia.
  var successMsg = 'Cadastro recebido com sucesso'
  if (validPdfFiles.length > 0) {
    successMsg += ' com ' + validPdfFiles.length + ' documento(s) anexado(s)'
  }
  return e.json(200, {
    success: true,
    message: successMsg,
    documentosRecebidos: validPdfFiles.length,
  })
})
