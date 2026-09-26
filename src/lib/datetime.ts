// Helpers de fuso horário (America/Sao_Paulo) compartilhados.
// PocketBase grava datas em UTC ("YYYY-MM-DD HH:MM:SS.SSSZ"). Toda exibição
// e todo parse de input do usuário devem passar por aqui.

/** Formata uma data UTC como dd/mm/aaaa HH:MM no fuso de Brasília. */
export function formatDateTimeBRT(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Converte o valor de um <input type="datetime-local"> ("YYYY-MM-DDTHH:mm",
 * interpretado como hora de Brasília) para o formato UTC do PocketBase
 * ("YYYY-MM-DD HH:MM:SS.SSSZ").
 */
export function localInputToUTC(value: string): string {
  if (!value) return ''
  // "YYYY-MM-DDTHH:mm" -> tratado como -03:00
  const iso = value.length === 16 ? `${value}:00-03:00` : `${value}-03:00`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().replace('T', ' ')
}

/**
 * Converte uma data UTC do PocketBase para o valor de um
 * <input type="datetime-local"> no fuso de Brasília ("YYYY-MM-DDTHH:mm").
 */
export function utcToLocalInput(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}
