/**
 * Centraliza funções utilitárias para tratamento de tags no Lazuli.
 *
 * Como as tags são persistidas no banco como string separada por vírgula (ex: "plantão 12h, Alzheimer"),
 * tags com espaços internos ou diferentes formatos de capitalização precisam ser lidadas de forma limpa,
 * sem duplicatas, ignorando itens vazios e normalizando comparações case-insensitive.
 */

/**
 * Faz o parse robusto de uma string de tags:
 * - Trata undefined/null/vazio
 * - Faz split por vírgula
 * - Faz trim de cada tag
 * - Descarta tags vazias
 * - Remove duplicatas preservando a primeira ocorrência (case-insensitive)
 */
export function parseTags(tags?: string | null): string[] {
  if (!tags) return []
  const parts = String(tags).split(',')
  const result: string[] = []
  const seen = new Set<string>()

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(trimmed)
    }
  }

  return result
}

/**
 * Junta um array de tags em uma string separada por vírgula e espaço,
 * garantindo trim e descarte de itens vazios ou duplicados.
 */
export function stringifyTags(tags?: (string | null | undefined)[] | null): string {
  if (!tags || !Array.isArray(tags)) return ''
  const clean = parseTags(tags.filter(Boolean).join(','))
  return clean.join(', ')
}

/**
 * Verifica se uma cuidadora ou lista de tags possui uma tag específica (case-insensitive).
 */
export function hasTag(tags: string | undefined | null | string[], targetTag: string): boolean {
  if (!targetTag) return false
  const targetLower = targetTag.trim().toLowerCase()
  if (!targetLower) return false

  const list = Array.isArray(tags) ? tags : parseTags(tags)
  return list.some((t) => t.trim().toLowerCase() === targetLower)
}

/**
 * Normaliza uma string de tag (trim simples).
 */
export function normalizeTag(tag: string): string {
  return String(tag || '').trim()
}
