routerAdd(
  'POST',
  '/backend/v1/importar-cuidadores',
  (e) => {
    // Autenticação obrigatória
    var userId = e.auth ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('Autenticacao necessaria')

    // Lê o CSV enviado como JSON no campo "content"
    var body = e.requestInfo().body || {}
    var content = body.content
    var filename = body.filename || 'upload.csv'
    if (!content) {
      return e.badRequestError('Conteudo CSV nao enviado (campo "content")')
    }
    content = String(content)

    // Remove BOM se existir
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1)

    // Normaliza quebras de linha
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    var lines = content.split('\n')

    // Conta ocorrências de um delimitador fora de aspas em uma linha
    var countDelimiter = function (line, delim) {
      var count = 0
      var inQuotes = false
      for (var i = 0; i < line.length; i++) {
        var ch = line[i]
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') i++
            else inQuotes = false
          }
        } else {
          if (ch === '"') inQuotes = true
          else if (ch === delim) count++
        }
      }
      return count
    }

    // Auto-detecta o delimitador a partir das primeiras linhas.
    // Escolhe o delimitador com contagem consistente e maior; empate -> ';'
    var detectDelimiter = function (sampleLines) {
      var sample = []
      for (var i = 0; i < Math.min(sampleLines.length, 5); i++) {
        if (sampleLines[i] && sampleLines[i].trim()) sample.push(sampleLines[i])
      }
      if (sample.length === 0) return ';'

      var semiCounts = sample.map(function (l) {
        return countDelimiter(l, ';')
      })
      var commaCounts = sample.map(function (l) {
        return countDelimiter(l, ',')
      })

      var semiConsistent =
        semiCounts.every(function (c) {
          return c === semiCounts[0]
        }) && semiCounts[0] > 0
      var commaConsistent =
        commaCounts.every(function (c) {
          return c === commaCounts[0]
        }) && commaCounts[0] > 0

      var semiAvg =
        semiCounts.reduce(function (a, b) {
          return a + b
        }, 0) / semiCounts.length
      var commaAvg =
        commaCounts.reduce(function (a, b) {
          return a + b
        }, 0) / commaCounts.length

      if (semiConsistent && !commaConsistent) return ';'
      if (commaConsistent && !semiConsistent) return ','
      if (semiConsistent && commaConsistent) {
        return semiAvg >= commaAvg ? ';' : ','
      }
      // Nenhum totalmente consistente — usa o de maior média (desempate -> ';')
      if (commaAvg > semiAvg) return ','
      return ';'
    }

    var delimiter = detectDelimiter(lines)

    // Parser CSV que respeita aspas e aceita delimitador como parâmetro (padrão ';')
    var parseLine = function (line, delim) {
      if (!delim) delim = delimiter || ';'
      var result = []
      var cur = ''
      var inQuotes = false
      for (var i = 0; i < line.length; i++) {
        var ch = line[i]
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') {
              cur += '"'
              i++
            } else {
              inQuotes = false
            }
          } else {
            cur += ch
          }
        } else {
          if (ch === '"') {
            inQuotes = true
          } else if (ch === delim) {
            result.push(cur)
            cur = ''
          } else {
            cur += ch
          }
        }
      }
      result.push(cur)
      return result
    }

    // Encontra o cabeçalho (linha com "E-mail" e "Nome")
    var headerIdx = -1
    var headers = []
    for (var h = 0; h < Math.min(lines.length, 5); h++) {
      var candidate = parseLine(lines[h])
      var joined = candidate.join(delimiter).toLowerCase()
      if (joined.indexOf('e-mail') !== -1 || joined.indexOf('email') !== -1) {
        if (joined.indexOf('nome') !== -1 || candidate.length > 20) {
          headerIdx = h
          headers = candidate
          break
        }
      }
    }
    if (headerIdx === -1) {
      return e.badRequestError('Cabeçalho do CSV nao encontrado (esperada coluna "E-mail")')
    }

    // Normaliza headers (trim + lowercase para lookup)
    var normHeaders = []
    for (var k = 0; k < headers.length; k++) {
      normHeaders.push(headers[k].trim())
    }

    var colIndex = function (name) {
      for (var i = 0; i < normHeaders.length; i++) {
        if (normHeaders[i] === name) return i
      }
      return -1
    }

    // Coleta os índices das colunas que nos interessam
    var idx = {
      cod: colIndex('cod'),
      dtCadastro: colIndex('Dt Cadastro'),
      indicacao: colIndex('Indicação'),
      disponibilidadeCsv: colIndex('Disponibilidade'),
      certific: colIndex('Certific'),
      dtContato: colIndex('Dt Contato'),
      nome: colIndex('Nome'),
      nascimento: colIndex('Nascimento'),
      endereco: colIndex('Endereço'),
      bairro: colIndex('Bairro'),
      cidade: colIndex('Cidade'),
      uf: colIndex('UF'),
      cep: colIndex('CEP'),
      telefone: colIndex('Telefone'),
      celular: colIndex('Celular'),
      email: colIndex('E-mail'),
      sexo: colIndex('Sexo'),
      identidade: colIndex('Identidade'),
      cpf: colIndex('CPF'),
      escolaridade: colIndex('Escolaridade'),
      cursoCuidador: colIndex('Curso de cuidadores realizado'),
      cargaHoraria: colIndex('Carga horária do curso'),
      tempoExp: colIndex('Tempo de Experiência como cuidador'),
      referencias1: colIndex('Referências de trabalhos realizados'),
      referencias2: colIndex('Período / Nome do Contato / Telefone'),
      outrosCursos1: colIndex('Outros cursos ou formações'),
      outrosCursos2: colIndex('Outras experiências relacionadas'),
      experienciaIlp: colIndex('Experiência ILP'),
      vacinaCovid: colIndex('Quantas doses da vacina COVID-19 você tomou?'),
      restricaoFisica: colIndex(
        'Possui alguma restrição física que impeça atividades como dar banho, fazer transferência cama–cadeira ou lidar com peso?  Se SIM, descreva quais são as restrições:  (Ex.: problemas de coluna, dor nos braços ou punhos, limitações de mobilidade, recomendações médicas etc.)',
      ),
      dispHorario: colIndex('Qual sua disponibilidade de horário?'),
      inicioImediato: colIndex('Pode iniciar imediatamente?  Em caso de “Não”, explique:'),
      declaracao: colIndex(
        'Declaração: "Declaro que todas as informações fornecidas são verdadeiras e estou ciente de que este formulário faz parte do processo de pré-cadastro para oportunidades futuras na empresa Lazuli Cuidadores de Idosos."',
      ),
      linkedin: colIndex('LinkedIn'),
      portfolio: colIndex('Portfólio'),
    }

    // Coleta linhas de dados (não vazias, após o cabeçalho)
    var dataLines = []
    for (var d = headerIdx + 1; d < lines.length; d++) {
      var line = lines[d]
      if (!line || !line.trim()) continue
      dataLines.push(line)
    }
    var total = dataLines.length

    // Helpers
    var getCell = function (cells, colIdx) {
      if (colIdx < 0 || colIdx >= cells.length) return ''
      var v = cells[colIdx]
      if (v === undefined || v === null) return ''
      return String(v).trim()
    }

    var onlyDigits = function (s) {
      return s.replace(/[^\d]/g, '')
    }

    // Converte datas em vários formatos BR para ISO (YYYY-MM-DD).
    // Aceita dd/mm/yyyy, d/m/yyyy, dd-mm-yyyy, e datas só com dígitos como 26082000.
    var parseDate = function (raw) {
      if (raw === undefined || raw === null) return ''
      var s = String(raw).trim()
      if (!s) return ''

      // Rejeita valores inválidos vindos de planilhas (#VALUE!, #REF!, 0, texto puro)
      var upper = s.toUpperCase()
      if (upper === '#VALUE!' || upper === '#REF!' || upper === '#N/A' || upper === '#NAME?') {
        return ''
      }
      if (upper.indexOf('VALUE') !== -1 || upper.indexOf('REF') !== -1) return ''

      // "0" ou apenas zeros não são datas válidas
      if (/^0+$/.test(s)) return ''

      // Tenta dd/mm/yyyy ou d/m/yyyy (separador / ou -)
      var m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/)
      if (m) {
        var dd = m[1].length < 2 ? '0' + m[1] : m[1]
        var mm = m[2].length < 2 ? '0' + m[2] : m[2]
        var yy = m[3]
        if (yy.length === 2) {
          // Ano 2 dígitos: 00-29 -> 20xx, 30-99 -> 19xx
          var yi = parseInt(yy, 10)
          yy = yi <= 29 ? '20' + yy : '19' + yy
        }
        return yy + '-' + mm + '-' + dd
      }

      // Data só com dígitos (ex.: 26082000) → assume dd/mm/yyyy
      var digits = s.replace(/[^\d]/g, '')
      if (digits.length === 8) {
        return digits.slice(4) + '-' + digits.slice(2, 4) + '-' + digits.slice(0, 2)
      }

      // Já está em ISO?
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

      // Qualquer outro texto (não-data) é ignorado sem quebrar
      return ''
    }

    var normDisponibilidade = function (raw) {
      if (!raw) return ''
      var s = String(raw).toLowerCase().trim()
      if (!s) return ''
      if (s.indexOf('sim') !== -1 || s.indexOf('dispon') !== -1) return 'disponível'
      return 'indisponível'
    }

    var normOrigem = function (raw) {
      if (!raw) return ''
      var s = String(raw).trim()
      if (!s) return ''
      var lower = s.toLowerCase()
      if (lower.indexOf('linkedin') !== -1) return 'LinkedIn'
      if (lower.indexOf('instagram') !== -1) return 'Instagram'
      if (lower.indexOf('site') !== -1) return 'Site'
      if (lower.indexOf('whats') !== -1) return 'WhatsApp'
      if (lower.indexOf('indic') !== -1) return 'Indicação'
      // Valores como "Lazuli", "EX Lazuli", "Sim Retiro" — trata como Indicação (default)
      return 'Indicação'
    }

    var normSexo = function (raw) {
      if (!raw) return ''
      var s = String(raw).toLowerCase().trim()
      if (!s) return ''
      if (s.indexOf('femin') !== -1 || s === 'f') return 'Feminino'
      if (s.indexOf('mascu') !== -1 || s === 'm') return 'Masculino'
      return 'Outro'
    }

    var mergeFields = function (a, b) {
      var parts = []
      if (a) parts.push(String(a).trim())
      if (b) parts.push(String(b).trim())
      return parts
        .filter(function (p) {
          return p !== ''
        })
        .join('\n---\n')
    }

    var col = $app.findCollectionByNameOrId('cuidadores')

    // Configura SSE
    e.response.header().set('Content-Type', 'text/event-stream')
    e.response.header().set('Cache-Control', 'no-cache')
    e.response.header().set('X-Accel-Buffering', 'no')

    var send = function (obj) {
      $response.write(e, 'data: ' + JSON.stringify(obj) + '\n\n')
      $response.flush(e)
    }

    send({ type: 'start', total: total })

    var inserted = 0
    var updated = 0
    var errors = 0

    for (var i = 0; i < dataLines.length; i++) {
      var cells = parseLine(dataLines[i])
      var nome = getCell(cells, idx.nome)
      var email = getCell(cells, idx.email)
      var cpf = onlyDigits(getCell(cells, idx.cpf))
      var telefone = getCell(cells, idx.telefone)
      var celular = getCell(cells, idx.celular)

      // Pula linhas totalmente sem identificação
      if (!nome && !email && !cpf && !telefone && !celular) {
        errors++
        send({
          type: 'progress',
          current: i + 1,
          total: total,
          inserted: inserted,
          updated: updated,
          errors: errors,
          nome: '(linha vazia)',
          status: 'erro',
        })
        continue
      }

      // Gera e-mail placeholder se vazio (campo é required)
      if (!email) {
        if (cpf) {
          email = 'cpf' + cpf + '@importacao.local'
        } else if (telefone) {
          email = 'tel' + onlyDigits(telefone) + '@importacao.local'
        } else if (celular) {
          email = 'cel' + onlyDigits(celular) + '@importacao.local'
        } else {
          email = 'semcontato' + (i + 1) + '@importacao.local'
        }
      }

      // Remove valores inválidos de CPF (#VALUE!, 0, vazio)
      if (cpf === '0' || cpf.indexOf('VALUE') !== -1) cpf = ''

      var record = null
      var existed = false

      // Busca por CPF (se houver)
      try {
        if (cpf) {
          var found = $app.findRecordsByFilter(
            'cuidadores',
            "cpf = '" + cpf.replace(/'/g, '') + "'",
            'created',
            1,
            0,
          )
          if (found.length > 0) {
            record = found[0]
            existed = true
          }
        }
      } catch (err) {}

      // Busca por email como fallback
      if (!record) {
        try {
          var foundEmail = $app.findRecordsByFilter(
            'cuidadores',
            "email = '" + email.replace(/'/g, '') + "'",
            'created',
            1,
            0,
          )
          if (foundEmail.length > 0) {
            record = foundEmail[0]
            existed = true
          }
        } catch (err) {}
      }

      if (!record) {
        record = new Record(col)
      }

      // Preenche campos
      try {
        record.set('nome', nome || 'Sem nome')
        record.set('email', email)

        if (telefone) record.set('telefone', telefone)
        if (celular) record.set('celular', celular)

        if (idx.cod >= 0) {
          var codRaw = onlyDigits(getCell(cells, idx.cod))
          if (codRaw) record.set('codigo', Number(codRaw))
        }

        if (idx.dtCadastro >= 0) {
          var dc = parseDate(getCell(cells, idx.dtCadastro))
          if (dc) record.set('data_cadastro', dc)
        }
        if (idx.dtContato >= 0) {
          var dcont = parseDate(getCell(cells, idx.dtContato))
          if (dcont) record.set('data_contato', dcont)
        }
        if (idx.nascimento >= 0) {
          var nasc = parseDate(getCell(cells, idx.nascimento))
          if (nasc) record.set('nascimento', nasc)
        }

        if (idx.endereco >= 0) {
          var end = getCell(cells, idx.endereco)
          if (end) record.set('endereco', end)
        }
        if (idx.bairro >= 0) {
          var bairro = getCell(cells, idx.bairro)
          if (bairro) record.set('bairro', bairro)
        }
        if (idx.cidade >= 0) {
          var cidade = getCell(cells, idx.cidade)
          if (cidade) record.set('cidade', cidade)
        }
        if (idx.uf >= 0) {
          var uf = getCell(cells, idx.uf)
          if (uf) record.set('uf', uf)
        }
        if (idx.cep >= 0) {
          var cep = getCell(cells, idx.cep)
          if (cep) record.set('cep', cep)
        }
        if (idx.sexo >= 0) {
          var sexo = normSexo(getCell(cells, idx.sexo))
          if (sexo) record.set('sexo', sexo)
        }
        if (idx.identidade >= 0) {
          var ident = getCell(cells, idx.identidade)
          if (ident && ident.indexOf('VALUE') === -1) record.set('identidade', ident)
        }
        if (cpf) record.set('cpf', cpf)

        // localizacao = cidade/uf
        var cidadeLoc = getCell(cells, idx.cidade)
        var ufLoc = getCell(cells, idx.uf)
        var locParts = []
        if (cidadeLoc) locParts.push(cidadeLoc)
        if (ufLoc) locParts.push(ufLoc)
        if (locParts.length > 0) record.set('localizacao', locParts.join('/'))

        if (idx.escolaridade >= 0) {
          var esc = getCell(cells, idx.escolaridade)
          if (esc) record.set('formacao', esc)
        }
        if (idx.cursoCuidador >= 0) {
          var cc = getCell(cells, idx.cursoCuidador)
          if (cc) record.set('curso_cuidador', cc)
        }
        if (idx.cargaHoraria >= 0) {
          var ch = getCell(cells, idx.cargaHoraria)
          if (ch && ch.indexOf('VALUE') === -1) record.set('carga_horaria_curso', ch)
        }
        if (idx.tempoExp >= 0) {
          var te = getCell(cells, idx.tempoExp)
          if (te && te.indexOf('VALUE') === -1) {
            record.set('tempo_experiencia', te)
            // campo experiencia existente recebe o mesmo valor
            record.set('experiencia', te)
          }
        }

        if (idx.referencias1 >= 0 || idx.referencias2 >= 0) {
          var refs = mergeFields(getCell(cells, idx.referencias1), getCell(cells, idx.referencias2))
          if (refs) record.set('referencias', refs)
        }
        if (idx.outrosCursos1 >= 0 || idx.outrosCursos2 >= 0) {
          var outros = mergeFields(
            getCell(cells, idx.outrosCursos1),
            getCell(cells, idx.outrosCursos2),
          )
          if (outros) record.set('outros_cursos_experiencias', outros)
        }
        if (idx.experienciaIlp >= 0) {
          var eilp = getCell(cells, idx.experienciaIlp)
          if (eilp) record.set('experiencia_ilp', eilp)
        }
        if (idx.vacinaCovid >= 0) {
          var vc = getCell(cells, idx.vacinaCovid)
          if (vc) record.set('vacina_covid', vc)
        }
        if (idx.restricaoFisica >= 0) {
          var rf = getCell(cells, idx.restricaoFisica)
          if (rf) record.set('restricao_fisica', rf)
        }
        if (idx.dispHorario >= 0) {
          var dh = getCell(cells, idx.dispHorario)
          if (dh) record.set('disponibilidade_horario', dh)
        }
        if (idx.inicioImediato >= 0) {
          var ii = getCell(cells, idx.inicioImediato)
          if (ii) record.set('inicio_imediato', ii)
        }
        if (idx.certific >= 0) {
          var certif = getCell(cells, idx.certific)
          if (certif) record.set('certific', certif)
        }
        if (idx.declaracao >= 0) {
          var decl = getCell(cells, idx.declaracao)
          if (decl) record.set('declaracao', decl)
        }
        if (idx.linkedin >= 0) {
          var li = getCell(cells, idx.linkedin)
          if (li) record.set('linkedin', li)
        }
        if (idx.portfolio >= 0) {
          var port = getCell(cells, idx.portfolio)
          if (port) record.set('portfolio', port)
        }

        // Disponibilidade (campo select existente)
        if (idx.disponibilidadeCsv >= 0) {
          var disp = normDisponibilidade(getCell(cells, idx.disponibilidadeCsv))
          if (disp) record.set('disponibilidade', disp)
        }

        // Origem (select existente) — coluna "Indicação"
        if (idx.indicacao >= 0) {
          var ind = getCell(cells, idx.indicacao)
          if (ind) record.set('origem', normOrigem(ind))
        }

        $app.save(record)
        if (existed) updated++
        else inserted++
      } catch (err) {
        errors++
        $app
          .logger()
          .error('importar-cuidadores linha', 'line', i + 1, 'nome', nome, 'error', String(err))
      }

      send({
        type: 'progress',
        current: i + 1,
        total: total,
        inserted: inserted,
        updated: updated,
        errors: errors,
        nome: nome,
        status: existed ? 'atualizado' : 'novo',
      })
    }

    send({
      type: 'done',
      total: total,
      inserted: inserted,
      updated: updated,
      errors: errors,
    })
  },
  $apis.requireAuth(),
)
