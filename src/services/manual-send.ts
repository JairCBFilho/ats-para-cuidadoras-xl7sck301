import pb from '@/lib/pocketbase/client'

export const sendManualEmail = (data: {
  to: string
  toName: string
  subject: string
  html: string
  templateId?: string
}) =>
  pb.send('/backend/v1/comunicacao/enviar-email', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
