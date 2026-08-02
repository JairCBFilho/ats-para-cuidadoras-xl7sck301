import pb from '@/lib/pocketbase/client'

export type StatusOnboarding = 'pendente' | 'concluida'
export type CategoriaOnboarding = 'Documentação' | 'Treinamento' | 'Contrato' | 'Outro'

export interface Onboarding {
  id: string
  candidata: string
  tarefa: string
  categoria: CategoriaOnboarding
  status: StatusOnboarding
  created: string
  updated: string
}

export const getOnboarding = (candidataId: string) =>
  pb.collection('onboarding').getFullList<Onboarding>({
    filter: `candidata = "${candidataId}"`,
    sort: '-created',
  })

export const createOnboarding = (data: Partial<Onboarding>) =>
  pb.collection('onboarding').create<Onboarding>(data)

export const updateOnboarding = (id: string, data: Partial<Onboarding>) =>
  pb.collection('onboarding').update<Onboarding>(id, data)

export const deleteOnboarding = (id: string) => pb.collection('onboarding').delete(id)
