import pb from '@/lib/pocketbase/client'

export type TipoNotificacao = 'nova_candidatura' | 'entrevista_proxima'

export interface Notificacao {
  id: string
  mensagem: string
  tipo: TipoNotificacao
  lida: boolean
  candidata: string
  vaga: string
  entrevista: string
  created: string
  updated: string
  expand?: {
    candidata?: { id: string; nome: string }
    vaga?: { id: string; cargo: string }
    entrevista?: { id: string; data_hora: string }
  }
}

export const getNotificacoes = () =>
  pb.collection('notificacoes').getFullList<Notificacao>({
    sort: '-created',
    expand: 'candidata,vaga,entrevista',
  })

export const markAsRead = (id: string) =>
  pb.collection('notificacoes').update<Notificacao>(id, { lida: true })

export const markAllAsRead = async () => {
  const unread = await pb
    .collection('notificacoes')
    .getFullList<Notificacao>({ filter: 'lida = false' })
  await Promise.all(unread.map((n) => pb.collection('notificacoes').update(n.id, { lida: true })))
}
