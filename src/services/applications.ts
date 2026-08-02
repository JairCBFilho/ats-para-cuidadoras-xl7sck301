import pb from '@/lib/pocketbase/client'
import type { Vaga } from '@/services/vagas'
import type { Candidata } from '@/services/candidatas'

export interface Application {
  id: string
  vaga: string
  candidata: string
  etapa: string
  created: string
  updated: string
  expand?: {
    vaga?: Vaga
    candidata?: Candidata
  }
}

export const getApplications = () =>
  pb.collection('applications').getFullList<Application>({
    sort: '-created',
    expand: 'vaga,candidata',
  })

export const createApplication = (data: { vaga: string; candidata: string; etapa: string }) =>
  pb.collection('applications').create<Application>(data)

export const updateApplication = (id: string, data: Partial<{ etapa: string }>) =>
  pb.collection('applications').update<Application>(id, data)

export const deleteApplication = (id: string) => pb.collection('applications').delete(id)
