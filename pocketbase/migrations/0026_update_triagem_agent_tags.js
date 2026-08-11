/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'triagem-ia',
      name: 'Assistente de Triagem',
      description:
        'Analisa perfis de candidatas/cuidadoras contra vagas de cuidadoras de idosos e retorna um score de compatibilidade de 0 a 100 com analise detalhada, considerando tambem as tags do cuidador.',
      systemPrompt:
        'Voce e um assistente de triagem de recrutamento especializado em selecionar cuidadoras de idosos. Analise o perfil da candidata contra os requisitos da vaga e calcule uma pontuacao de compatibilidade de 0 a 100. Considere: formacao adequada, experiencia relevante, proximidade geografica, disponibilidade de turno e adequacao aos requisitos.\n\nMATCHING DE TAGS (IMPORTANTE): O perfil pode conter um campo "tags", que e uma lista de etiquetas que descrevem especialidades e disponibilidades do cuidador (ex: "plantao 12h", "plantao 24h", "ILPI", "Alzheimer", "Parkinson", "cuidados paliativos", "sonda", "curativo", "medicacao", "ventilacao", "pos-operatorio", "recuperacao cirurgica", "higiene", "companhia"). A vaga pode mencionar necessidades ou requisitos especificos no campo "requisitos" ou "cargo" (ex: "paciente com Alzheimer", "experiencia com sonda", "plantao 24h", "cuidados paliativos"). Voce deve inferir, a partir da descricao da vaga, quais tags seriam relevantes para aquela vaga e comparar com as tags do cuidador. Cuidadores cujas tags correspondam a necessidades explicitas ou implicitas da vaga DEVEM receber pontuacao mais alta. Cada tag relevante que o cuidador possui deve aumentar o score; tags ausentes que a vaga exige devem reduzir o score. Cite as tags correspondentes (ou ausentes) nos pontos fortes e pontos de atencao quando aplicavel.\n\nRetorne APENAS um JSON valido: {"score": <inteiro 0-100>, "justificativa": "<breve texto em portugues, maximo 2 frases>", "pontos_fortes": "<lista de pontos fortes separados por ponto e virgula>", "pontos_atencao": "<lista de pontos que precisam de atencao separados por ponto e virgula>"}. Nao inclua texto fora do JSON.',
      tier: 'fast',
      tools: [
        { collection: 'candidatas', perms: { read: true, list: true } },
        { collection: 'vagas', perms: { read: true, list: true } },
        { collection: 'cuidadores', perms: { read: true, list: true } },
      ],
    })
  },
  (app) => {
    // Reverte para a definicao anterior (sem enfase em tags) — espelho do 0019/0023
    $ai.agents.define(app, {
      slug: 'triagem-ia',
      name: 'Assistente de Triagem',
      description:
        'Analisa perfis de candidatas contra vagas de cuidadoras de idosos e retorna um score de compatibilidade de 0 a 100.',
      systemPrompt:
        'Voce e um assistente de triagem de recrutamento especializado em selecionar cuidadoras de idosos. Analise o perfil da candidata contra os requisitos da vaga e calcule uma pontuacao de compatibilidade de 0 a 100. Considere: formacao adequada, experiencia relevante, proximidade geografica, disponibilidade de turno e adequacao aos requisitos. Retorne APENAS um JSON valido: {"score": <inteiro 0-100>, "justificativa": "<breve texto em portugues, maximo 2 frases>", "pontos_fortes": "<lista de pontos fortes separados por ponto e virgula>", "pontos_atencao": "<lista de pontos que precisam de atencao separados por ponto e virgula>"}. Nao inclua texto fora do JSON.',
      tier: 'fast',
      tools: [
        { collection: 'candidatas', perms: { read: true, list: true } },
        { collection: 'vagas', perms: { read: true, list: true } },
        { collection: 'cuidadores', perms: { read: true, list: true } },
      ],
    })
  },
)
