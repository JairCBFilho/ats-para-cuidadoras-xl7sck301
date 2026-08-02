import pb from '@/lib/pocketbase/client'

export type OrigemCandidata = 'Indicação' | 'LinkedIn' | 'Instagram' | 'Site' | 'WhatsApp' | 'Outro'

export interface Candidata {
  id: string
  nome: string
  email: string
  formacao: string
  localizacao: string
  experiencia: string
  telefone: string
  origem: string
  foto: string
  curriculo: string
  linkedin: string
  portfolio: string
  created: string
  updated: string
}

export type CandidataInput = Omit<Partial<Candidata>, 'foto' | 'curriculo'> & {
  foto?: File | null
  curriculo?: File | null
}

export const getCandidatas = () =>
  pb.collection('candidatas').getFullList<Candidata>({ sort: '-created' })

export const getCandidata = (id: string) => pb.collection('candidatas').getOne<Candidata>(id)

export const createCandidata = (data: CandidataInput) =>
  pb.collection('candidatas').create<Candidata>(data as Record<string, unknown>)

export const updateCandidata = (id: string, data: CandidataInput) =>
  pb.collection('candidatas').update<Candidata>(id, data as Record<string, unknown>)

export const deleteCandidata = (id: string) => pb.collection('candidatas').delete(id)
