/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'triagem-ia',
      name: 'Assistente de Triagem',
      description:
        'Analisa perfis de candidatas contra vagas de cuidadoras de idosos e retorna um score de compatibilidade de 0 a 100.',
      systemPrompt:
        'Voce e um assistente de triagem de recrutamento especializado em selecionar cuidadoras de idosos. Analise o perfil da candidata contra os requisitos da vaga e calcule uma pontuacao de compatibilidade de 0 a 100. Considere: formacao adequada, experiencia relevante, proximidade geografica, disponibilidade de turno e adequacao aos requisitos. Retorne APENAS um JSON valido: {"score": <inteiro 0-100>, "justificativa": "<breve texto em portugues, maximo 2 frases>"}. Nao inclua texto fora do JSON.',
      tier: 'fast',
      tools: [
        { collection: 'candidatas', perms: { read: true, list: true } },
        { collection: 'vagas', perms: { read: true, list: true } },
      ],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'triagem-ia')
  },
)
