import pb from '@/lib/pocketbase/client'

export type StatusReferencia = 'pendente' | 'confirmada' | 'rejeitada'

export interface Referencia {
  id: string
  candidata: string
  nome: string
  contato: string
  relacionamento: string
  status: StatusReferencia
  observacoes: string
  created: string
  updated: string
}

export const getReferencias = (candidataId: string) =>
  pb.collection('referencias').getFullList<Referencia>({
    filter: `candidata = "${candidataId}"`,
    sort: '-created',
  })

export const createReferencia = (data: Partial<Referencia>) =>
  pb.collection('referencias').create<Referencia>(data)

export const updateReferencia = (id: string, data: Partial<Referencia>) =>
  pb.collection('referencias').update<Referencia>(id, data)

export const deleteReferencia = (id: string) => pb.collection('referencias').delete(id)
