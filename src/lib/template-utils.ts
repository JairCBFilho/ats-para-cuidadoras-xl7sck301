export interface TemplateVars {
  nome_candidata: string
  cargo: string
  etapa: string
  nome_vaga: string
  data_entrevista: string
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'data a confirmar'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'data a confirmar'
  }
}

export function replaceTemplateVariables(text: string, vars: TemplateVars): string {
  return text
    .replace(/{nome_candidata}/g, vars.nome_candidata)
    .replace(/{cargo}/g, vars.cargo)
    .replace(/{etapa}/g, vars.etapa)
    .replace(/{nome_vaga}/g, vars.nome_vaga)
    .replace(/{data_entrevista}/g, vars.data_entrevista)
}
