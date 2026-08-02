import pb from '@/lib/pocketbase/client'

export type EtapaEmail = 'Triagem' | 'Entrevista' | 'Aprovada' | 'Rejeitada'

export interface EmailTemplate {
  id: string
  etapa: EtapaEmail
  assunto: string
  corpo: string
  created: string
  updated: string
}

export const getEmailTemplates = () =>
  pb.collection('email_templates').getFullList<EmailTemplate>({ sort: 'etapa' })

export const createEmailTemplate = (data: Partial<EmailTemplate>) =>
  pb.collection('email_templates').create<EmailTemplate>(data)

export const updateEmailTemplate = (id: string, data: Partial<EmailTemplate>) =>
  pb.collection('email_templates').update<EmailTemplate>(id, data)

export const deleteEmailTemplate = (id: string) => pb.collection('email_templates').delete(id)
