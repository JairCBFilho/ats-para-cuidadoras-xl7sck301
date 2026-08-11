import pb from '@/lib/pocketbase/client'

export type Disponibilidade = 'disponível' | 'indisponível'
export type TurnoCuidador = '12h' | '24h'
export type OrigemCuidador = 'Indicação' | 'LinkedIn' | 'Instagram' | 'Site' | 'WhatsApp' | 'Outro'

export interface Cuidador {
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
  disponibilidade: string
  especialidades: string
  turno: string
  codigo: number
  data_cadastro: string
  data_contato: string
  nascimento: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  celular: string
  sexo: string
  identidade: string
  cpf: string
  curso_cuidador: string
  carga_horaria_curso: string
  tempo_experiencia: string
  referencias: string
  outros_cursos_experiencias: string
  experiencia_ilp: string
  vacina_covid: string
  restricao_fisica: string
  disponibilidade_horario: string
  inicio_imediato: string
  certific: string
  declaracao: string
  created: string
  updated: string
}

export type CuidadorInput = Omit<Partial<Cuidador>, 'foto' | 'curriculo'> & {
  foto?: File | null
  curriculo?: File | null
}

export const getCuidadores = () =>
  pb.collection('cuidadores').getFullList<Cuidador>({ sort: '-created' })

export const getCuidador = (id: string) => pb.collection('cuidadores').getOne<Cuidador>(id)

export const createCuidador = (data: CuidadorInput) =>
  pb.collection('cuidadores').create<Cuidador>(data as Record<string, unknown>)

export const updateCuidador = (id: string, data: CuidadorInput) =>
  pb.collection('cuidadores').update<Cuidador>(id, data as Record<string, unknown>)

export const deleteCuidador = (id: string) => pb.collection('cuidadores').delete(id)
