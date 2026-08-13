import pb from '@/lib/pocketbase/client'

/**
 * Valida dígitos verificadores do CPF.
 */
export function isValidCPF(cpf: string): boolean {
  const digits = (cpf || '').replace(/[^\d]/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const calcCheck = (slice: string, weights: number[]): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i], 10) * weights[i]
    }
    let rem = (sum * 10) % 11
    if (rem === 10) rem = 0
    return rem
  }

  const d1 = calcCheck(digits.substring(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d1 !== parseInt(digits[9], 10)) return false
  const d2 = calcCheck(digits.substring(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d2 !== parseInt(digits[10], 10)) return false
  return true
}

/** Formata CPF para exibição: 123.456.789-09 */
export function formatCPF(value: string): string {
  const d = (value || '').replace(/[^\d]/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Formata telefone/celular BR: (21) 98888-7777 */
export function formatPhone(value: string): string {
  const d = (value || '').replace(/[^\d]/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export interface CadastroPublicoPayload {
  token: string
  nome: string
  email: string
  telefone: string
  cpf: string
  data_nascimento?: string
  endereco?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  celular?: string
  sexo?: string
  identidade?: string
  formacao?: string
  curso_cuidador?: string
  carga_horaria_curso?: string
  tempo_experiencia?: string
  referencias?: string
  outros_cursos_experiencias?: string
  experiencia_ilp?: string
  vacina_covid?: string
  restricao_fisica?: string
  disponibilidade_horario?: string
  inicio_imediato?: string
  disponibilidade?: string
  turno?: string
  especialidades?: string
  linkedin?: string
  portfolio?: string
  foto?: File | null
  curriculo?: File | null
}

export async function submitCadastroPublico(
  payload: CadastroPublicoPayload,
): Promise<{ success: boolean; message: string }> {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/cadastro-publico`

  // Campos de arquivo são enviados via multipart; o restante como campos do FormData.
  const formData = new FormData()
  const keys = Object.keys(payload) as (keyof CadastroPublicoPayload)[]
  for (const key of keys) {
    if (key === 'foto' || key === 'curriculo') continue
    const val = payload[key]
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      formData.append(key, String(val))
    }
  }
  if (payload.foto) formData.append('foto', payload.foto)
  if (payload.curriculo) formData.append('curriculo', payload.curriculo)

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao enviar cadastro.')
  }
  return { success: true, message: data?.message || 'Cadastro recebido com sucesso' }
}

/** Regenera o token de cadastro público (rota autenticada de admin). */
export async function regenerarTokenCadastro(): Promise<string> {
  const url = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/cadastro-publico/regenerar-token`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: pb.authStore.token || '',
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Erro ao regenerar token.')
  }
  return data.token as string
}
