import pb from '@/lib/pocketbase/client'

export interface Vaga {
  id: string
  cargo: string
  localizacao: string
  turno: string
  requisitos: string
  status: string
  created: string
  updated: string
}

export const getVagas = () => pb.collection('vagas').getFullList<Vaga>({ sort: '-created' })

export const getVaga = (id: string) => pb.collection('vagas').getOne<Vaga>(id)

export const createVaga = (data: Partial<Vaga>) => pb.collection('vagas').create<Vaga>(data)

export const updateVaga = (id: string, data: Partial<Vaga>) =>
  pb.collection('vagas').update<Vaga>(id, data)

export const deleteVaga = (id: string) => pb.collection('vagas').delete(id)
