import pb from '@/lib/pocketbase/client'
import type { Candidata } from '@/services/candidatas'
import type { Vaga } from '@/services/vagas'

export type Etapa = 'Triagem' | 'Entrevista' | 'Aprovada' | 'Rejeitada'

export interface Application {
  id: string
  vaga: string
  candidata: string
  etapa: Etapa
  compatibilidade?: number
  pontos_fortes?: string
  pontos_atencao?: string
  justificativa?: string
  created: string
  updated: string
  /** Registros relacionados expandidos pelo PocketBase (via `expand`). */
  expand?: {
    candidata?: Candidata
    vaga?: Vaga
    [k: string]: unknown
  }
}

export const getApplications = () =>
  pb.collection('applications').getFullList<Application>({
    sort: '-created',
    expand: 'vaga,candidata',
  })

export const getApplication = (id: string) =>
  pb.collection('applications').getOne<Application>(id, { expand: 'vaga,candidata' })

export const createApplication = (data: Partial<Application>) =>
  pb.collection('applications').create<Application>(data)

export const updateApplication = (id: string, data: Partial<Application>) =>
  pb.collection('applications').update<Application>(id, data)

export const deleteApplication = (id: string) => pb.collection('applications').delete(id)

export const getApplicationsByCandidata = (candidataId: string) =>
  pb.collection('applications').getFullList<Application>({
    filter: `candidata = "${candidataId}"`,
    expand: 'vaga,candidata',
  })

export const getApplicationsByVaga = (vagaId: string) =>
  pb.collection('applications').getFullList<Application>({
    filter: `vaga = "${vagaId}"`,
    sort: '-created',
    expand: 'candidata',
  })
