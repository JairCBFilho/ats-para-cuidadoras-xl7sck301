import pb from '@/lib/pocketbase/client'
import type { Candidata } from '@/services/candidatas'
import type { Vaga } from '@/services/vagas'

export type StatusEntrevista = 'agendada' | 'realizada' | 'cancelada'

export interface Entrevista {
  id: string
  candidata: string
  vaga: string
  data_hora: string
  status: StatusEntrevista
  observacoes: string
  created: string
  updated: string
  /** Registros relacionados expandidos pelo PocketBase (via `expand`). */
  expand?: {
    candidata?: Candidata
    vaga?: Vaga
    [k: string]: unknown
  }
}

export const getEntrevistas = () =>
  pb.collection('entrevistas').getFullList<Entrevista>({
    sort: 'data_hora',
    expand: 'candidata,vaga',
  })

export const getEntrevista = (id: string) =>
  pb.collection('entrevistas').getOne<Entrevista>(id, { expand: 'candidata,vaga' })

export const createEntrevista = (data: Partial<Entrevista>) =>
  pb.collection('entrevistas').create<Entrevista>(data)

export const updateEntrevista = (id: string, data: Partial<Entrevista>) =>
  pb.collection('entrevistas').update<Entrevista>(id, data)

export const deleteEntrevista = (id: string) => pb.collection('entrevistas').delete(id)

export const getEntrevistasByCandidata = (candidataId: string) =>
  pb.collection('entrevistas').getFullList<Entrevista>({
    filter: `candidata = "${candidataId}"`,
    sort: 'data_hora',
    expand: 'vaga',
  })
