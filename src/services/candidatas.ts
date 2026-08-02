import pb from '@/lib/pocketbase/client'

export interface Candidata {
  id: string
  nome: string
  formacao: string
  localizacao: string
  experiencia: string
  created: string
  updated: string
}

export const getCandidatas = () =>
  pb.collection('candidatas').getFullList<Candidata>({ sort: '-created' })

export const getCandidata = (id: string) => pb.collection('candidatas').getOne<Candidata>(id)

export const createCandidata = (data: Partial<Candidata>) =>
  pb.collection('candidatas').create<Candidata>(data)

export const updateCandidata = (id: string, data: Partial<Candidata>) =>
  pb.collection('candidatas').update<Candidata>(id, data)

export const deleteCandidata = (id: string) => pb.collection('candidatas').delete(id)
