import pb from '@/lib/pocketbase/client'
import type { BulkSendResult } from '@/services/bulk-send'

export interface DisparoPorTagEmailResult {
  enviados: number
  total: number
  erros: { nome: string; error: string }[]
}

export const dispararPorTag = (data: {
  tags: string[]
  canal: 'email' | 'whatsapp'
  templateId: string
}) =>
  pb.send('/backend/v1/disparar-por-tag', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }) as Promise<DisparoPorTagEmailResult | { results: BulkSendResult[]; total: number }>
