import pb from '@/lib/pocketbase/client'

export interface BulkSendResult {
  candidataId: string
  success: boolean
  error?: string
  link?: string
}

export const bulkSend = (data: {
  candidataIds: string[]
  vagaId: string
  etapa: string
  canal: string
}) =>
  pb.send('/backend/v1/comunicacao/bulk-send', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }) as Promise<{ results: BulkSendResult[] }>
