import { useMemo } from 'react'
import type { BulkSendResult } from '@/services/bulk-send'
import { normalizeWhatsAppWebLink } from '@/hooks/use-whatsapp-queue'

/**
 * Filtra e normaliza os links de WhatsApp de um resultado de envio em lote,
 * garantindo consistência com o campo `success` e formatação do link.
 */
export function extractValidWhatsAppLinks(results?: BulkSendResult[] | null): BulkSendResult[] {
  if (!results || !Array.isArray(results)) return []
  return results
    .filter((r) => Boolean(r && r.success && r.link && String(r.link).trim().length > 0))
    .map((r) => ({
      ...r,
      link: normalizeWhatsAppWebLink(r.link!),
    }))
}

/**
 * Conta quantos e-mails ou envios foram bem-sucedidos em um lote.
 */
export function countSuccessfulSends(results?: BulkSendResult[] | null): number {
  if (!results || !Array.isArray(results)) return 0
  return results.filter((r) => Boolean(r && r.success)).length
}

/**
 * Substitui variáveis comuns de templates em texto ou corpo.
 */
export function applyTemplateReplacements(
  text: string,
  vars: {
    nomeCandidata?: string
    nomeVaga?: string
    cargo?: string
    etapa?: string
    dataEntrevista?: string
  },
): string {
  if (!text) return ''
  return text
    .replace(/{nome_candidata}/g, vars.nomeCandidata || '')
    .replace(/{nome_vaga}/g, vars.nomeVaga || vars.cargo || '')
    .replace(/{cargo}/g, vars.cargo || vars.nomeVaga || '')
    .replace(/{etapa}/g, vars.etapa || '')
    .replace(/{data_entrevista}/g, vars.dataEntrevista || 'data a confirmar')
}

/**
 * Hook para gerar pré-visualização consistente de template.
 */
export function useTemplatePreview(
  template: { assunto?: string; corpo?: string } | null | undefined,
  vars: {
    nomeCandidata?: string
    nomeVaga?: string
    cargo?: string
    etapa?: string
    dataEntrevista?: string
  },
) {
  return useMemo(() => {
    if (!template) return null
    return {
      assunto: applyTemplateReplacements(template.assunto || '', vars),
      corpo: applyTemplateReplacements(template.corpo || '', vars),
    }
  }, [template, vars.nomeCandidata, vars.nomeVaga, vars.cargo, vars.etapa, vars.dataEntrevista])
}
