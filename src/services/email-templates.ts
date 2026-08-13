import pb from '@/lib/pocketbase/client'

export type EtapaEmail =
  | 'Triagem'
  | 'Entrevista'
  | 'Aprovada'
  | 'Rejeitada'
  | 'AtualizacaoCadastro'
  | 'VerificacaoDisponibilidade'
  | 'LembreteEntrevista'

/** Rótulos de exibição legíveis para cada etapa de comunicação. */
export const ETAPA_LABELS: Record<EtapaEmail, string> = {
  Triagem: 'Triagem',
  Entrevista: 'Entrevista',
  Aprovada: 'Aprovada',
  Rejeitada: 'Rejeitada',
  AtualizacaoCadastro: 'Atualização de Cadastro',
  VerificacaoDisponibilidade: 'Verificação de Disponibilidade',
  LembreteEntrevista: 'Lembrete de Entrevista',
}

export interface EmailTemplate {
  id: string
  etapa: EtapaEmail
  canal: 'email' | 'whatsapp'
  assunto: string
  corpo: string
  anexo: string
  created: string
  updated: string
}

export type EmailTemplateInput = Omit<Partial<EmailTemplate>, 'anexo'> & { anexo?: File | null }

export const getEmailTemplates = () =>
  pb.collection('email_templates').getFullList<EmailTemplate>({ sort: 'etapa,canal' })

export const createEmailTemplate = (data: EmailTemplateInput) =>
  pb.collection('email_templates').create<EmailTemplate>(data as Record<string, unknown>)

export const updateEmailTemplate = (id: string, data: EmailTemplateInput) =>
  pb.collection('email_templates').update<EmailTemplate>(id, data as Record<string, unknown>)

export const deleteEmailTemplate = (id: string) => pb.collection('email_templates').delete(id)
