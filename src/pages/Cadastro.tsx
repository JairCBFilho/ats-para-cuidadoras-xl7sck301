import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle2, ShieldAlert, Camera, FileText, X } from 'lucide-react'
import {
  isValidCPF,
  formatCPF,
  formatPhone,
  submitCadastroPublico,
} from '@/services/cadastro-publico'
import { useToast } from '@/hooks/use-toast'
import lazuliLogo from '@/assets/simbolo-lazuli-cmyk-fundo-azul-f722e.jpg'
import { cn } from '@/lib/utils'

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

interface FormState {
  nome: string
  email: string
  telefone: string
  cpf: string
  data_nascimento: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  celular: string
  sexo: string
  identidade: string
  formacao: string
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
  disponibilidade: string
  turno: string
  especialidades: string
  linkedin: string
  portfolio: string
}

const EMPTY: FormState = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  data_nascimento: '',
  endereco: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  celular: '',
  sexo: '',
  identidade: '',
  formacao: '',
  curso_cuidador: '',
  carga_horaria_curso: '',
  tempo_experiencia: '',
  referencias: '',
  outros_cursos_experiencias: '',
  experiencia_ilp: '',
  vacina_covid: '',
  restricao_fisica: '',
  disponibilidade_horario: '',
  inicio_imediato: '',
  disponibilidade: '',
  turno: '',
  especialidades: '',
  linkedin: '',
  portfolio: '',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-6 w-1 rounded-full bg-[#F5C518]" />
      <h2 className="text-xl font-semibold text-neutral-900">{children}</h2>
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-sm font-medium text-neutral-700 mb-1.5 block">
      {children}
      {required && <span className="text-[#F5C518] ml-0.5">*</span>}
    </Label>
  )
}

export default function Cadastro() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { toast } = useToast()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [foto, setFoto] = useState<File | null>(null)
  const [curriculo, setCurriculo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const authorized = useMemo(() => Boolean(token), [token])

  useEffect(() => {
    if (!authorized) return
    window.scrollTo(0, 0)
  }, [authorized])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório'
    if (!form.email.trim()) e.email = 'E-mail é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido'
    if (!form.telefone.trim()) e.telefone = 'Telefone é obrigatório'
    if (!form.cpf.trim()) e.cpf = 'CPF é obrigatório'
    else if (!isValidCPF(form.cpf)) e.cpf = 'CPF inválido'
    return e
  }, [form])

  const isValid = Object.keys(errors).length === 0

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setTouched({
      nome: true,
      email: true,
      telefone: true,
      cpf: true,
    })
    if (!isValid) {
      toast({
        title: 'Verifique os campos',
        description: 'Preencha corretamente os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await submitCadastroPublico({
        token,
        ...form,
        foto,
        curriculo,
      })
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast({
        title: 'Erro ao enviar',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Tela de acesso não autorizado ---
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-3xl border-neutral-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Acesso não autorizado</h1>
          <p className="text-neutral-600 leading-relaxed mb-6">
            Você precisa de um link válido com o token de cadastro para acessar esta página.
            Solicite o link oficial à equipe Lazuli e tente novamente.
          </p>
          <p className="text-sm text-neutral-400">
            Se você acredita que isto é um erro, entre em contato pelo canal oficial.
          </p>
        </Card>
      </div>
    )
  }

  // --- Tela de sucesso ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-3xl border-neutral-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
            Cadastro recebido com sucesso!
          </h1>
          <p className="text-neutral-600 leading-relaxed mb-6">
            Obrigada por se cadastrar no banco de talentos da Lazuli. Nossa equipe irá analisar suas
            informações e entrar em contato quando houver uma oportunidade compatível.
          </p>
          <p className="text-sm text-neutral-400">Você já pode fechar esta página.</p>
        </Card>
      </div>
    )
  }

  // --- Formulário ---
  return (
    <div className="min-h-screen bg-[#FBF7EF] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <img
              src={lazuliLogo}
              alt="Lazuli Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-sm"
            />
            <span className="text-xl font-semibold text-neutral-900">Lazuli</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Cadastro de Cuidadoras</h1>
          <p className="text-neutral-600 max-w-xl mx-auto">
            Preencha o formulário abaixo para entrar no nosso banco de talentos. Os campos com{' '}
            <span className="text-[#F5C518] font-semibold">*</span> são obrigatórios.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FieldLabel required>Nome completo</FieldLabel>
                <Input
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                  placeholder="Seu nome completo"
                  className={cn(
                    'rounded-xl',
                    touched.nome && errors.nome && 'border-red-400 focus-visible:ring-red-400',
                  )}
                />
                {touched.nome && errors.nome && (
                  <p className="text-xs text-red-500 mt-1">{errors.nome}</p>
                )}
              </div>

              <div>
                <FieldLabel required>CPF</FieldLabel>
                <Input
                  value={formatCPF(form.cpf)}
                  onChange={(e) => set('cpf', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, cpf: true }))}
                  placeholder="000.000.000-00"
                  className={cn(
                    'rounded-xl',
                    touched.cpf && errors.cpf && 'border-red-400 focus-visible:ring-red-400',
                  )}
                />
                {touched.cpf && errors.cpf && (
                  <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>
                )}
              </div>

              <div>
                <FieldLabel>Data de nascimento</FieldLabel>
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => set('data_nascimento', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Sexo</FieldLabel>
                <Select value={form.sexo} onValueChange={(v) => set('sexo', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Prefiro não dizer">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>Identidade de gênero</FieldLabel>
                <Input
                  value={form.identidade}
                  onChange={(e) => set('identidade', e.target.value)}
                  placeholder="Opcional"
                  className="rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Contato */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Contato</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel required>E-mail</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="voce@email.com"
                  className={cn(
                    'rounded-xl',
                    touched.email && errors.email && 'border-red-400 focus-visible:ring-red-400',
                  )}
                />
                {touched.email && errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <FieldLabel required>Telefone</FieldLabel>
                <Input
                  value={formatPhone(form.telefone)}
                  onChange={(e) => set('telefone', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, telefone: true }))}
                  placeholder="(00) 00000-0000"
                  className={cn(
                    'rounded-xl',
                    touched.telefone &&
                      errors.telefone &&
                      'border-red-400 focus-visible:ring-red-400',
                  )}
                />
                {touched.telefone && errors.telefone && (
                  <p className="text-xs text-red-500 mt-1">{errors.telefone}</p>
                )}
              </div>

              <div>
                <FieldLabel>Celular</FieldLabel>
                <Input
                  value={formatPhone(form.celular)}
                  onChange={(e) => set('celular', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>LinkedIn</FieldLabel>
                <Input
                  value={form.linkedin}
                  onChange={(e) => set('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/voce"
                  className="rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Portfolio / site</FieldLabel>
                <Input
                  value={form.portfolio}
                  onChange={(e) => set('portfolio', e.target.value)}
                  placeholder="Opcional"
                  className="rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Endereço */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FieldLabel>Endereço</FieldLabel>
                <Input
                  value={form.endereco}
                  onChange={(e) => set('endereco', e.target.value)}
                  placeholder="Rua, número, complemento"
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Bairro</FieldLabel>
                <Input
                  value={form.bairro}
                  onChange={(e) => set('bairro', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>CEP</FieldLabel>
                <Input
                  value={form.cep}
                  onChange={(e) => set('cep', e.target.value)}
                  placeholder="00000-000"
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Cidade</FieldLabel>
                <Input
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>UF</FieldLabel>
                <Select value={form.uf} onValueChange={(v) => set('uf', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Formação */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Formação</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <FieldLabel>Escolaridade / Formação</FieldLabel>
                <Input
                  value={form.formacao}
                  onChange={(e) => set('formacao', e.target.value)}
                  placeholder="Ex: Ensino Médio completo, Curso Técnico em Enfermagem..."
                  className="rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Curso de cuidador</FieldLabel>
                <Input
                  value={form.curso_cuidador}
                  onChange={(e) => set('curso_cuidador', e.target.value)}
                  placeholder="Nome do curso e instituição"
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Carga horária do curso</FieldLabel>
                <Input
                  value={form.carga_horaria_curso}
                  onChange={(e) => set('carga_horaria_curso', e.target.value)}
                  placeholder="Ex: 80h"
                  className="rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Outros cursos e experiências</FieldLabel>
                <Textarea
                  value={form.outros_cursos_experiencias}
                  onChange={(e) => set('outros_cursos_experiencias', e.target.value)}
                  placeholder="Liste outros cursos relevantes, certificações, etc."
                  className="rounded-xl min-h-[90px]"
                />
              </div>
            </div>
          </Card>

          {/* Experiência */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Experiência</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Tempo de experiência</FieldLabel>
                <Input
                  value={form.tempo_experiencia}
                  onChange={(e) => set('tempo_experiencia', e.target.value)}
                  placeholder="Ex: 3 anos"
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Experiência com ILP?</FieldLabel>
                <Select
                  value={form.experiencia_ilp}
                  onValueChange={(v) => set('experiencia_ilp', v)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Especialidades</FieldLabel>
                <Textarea
                  value={form.especialidades}
                  onChange={(e) => set('especialidades', e.target.value)}
                  placeholder="Ex: Idosos, PCD, pós-operatório, cuidados paliativos..."
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Referências</FieldLabel>
                <Textarea
                  value={form.referencias}
                  onChange={(e) => set('referencias', e.target.value)}
                  placeholder="Informe referências profissionais com contato, se houver"
                  className="rounded-xl min-h-[80px]"
                />
              </div>
            </div>
          </Card>

          {/* Saúde / Disponibilidade */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Saúde / Disponibilidade</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Vacina contra COVID-19</FieldLabel>
                <Select value={form.vacina_covid} onValueChange={(v) => set('vacina_covid', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vacinada (dose completa)">
                      Vacinada (dose completa)
                    </SelectItem>
                    <SelectItem value="Vacinada (reforço)">Vacinada (reforço)</SelectItem>
                    <SelectItem value="Não vacinada">Não vacinada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>Restrição física</FieldLabel>
                <Input
                  value={form.restricao_fisica}
                  onChange={(e) => set('restricao_fisica', e.target.value)}
                  placeholder="Ex: Nenhuma, problemas de coluna..."
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Disponibilidade</FieldLabel>
                <Select
                  value={form.disponibilidade}
                  onValueChange={(v) => set('disponibilidade', v)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponível">Disponível</SelectItem>
                    <SelectItem value="indisponível">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>Turno</FieldLabel>
                <Select value={form.turno} onValueChange={(v) => set('turno', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12h</SelectItem>
                    <SelectItem value="24h">24h</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>Disponibilidade de horário</FieldLabel>
                <Input
                  value={form.disponibilidade_horario}
                  onChange={(e) => set('disponibilidade_horario', e.target.value)}
                  placeholder="Ex: Manhã e tarde, plantões..."
                  className="rounded-xl"
                />
              </div>

              <div>
                <FieldLabel>Início imediato?</FieldLabel>
                <Select
                  value={form.inicio_imediato}
                  onValueChange={(v) => set('inicio_imediato', v)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Uploads */}
          <Card className="rounded-3xl border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
            <SectionTitle>Documentos (opcional)</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Foto */}
              <div>
                <FieldLabel>Foto</FieldLabel>
                {foto ? (
                  <div className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                    <Camera className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm text-neutral-700 truncate flex-1">{foto.name}</span>
                    <button
                      type="button"
                      onClick={() => setFoto(null)}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 p-3 hover:border-[#F5C518] transition-colors">
                    <Camera className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm text-neutral-500">Enviar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              {/* Currículo */}
              <div>
                <FieldLabel>Currículo</FieldLabel>
                {curriculo ? (
                  <div className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                    <FileText className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm text-neutral-700 truncate flex-1">
                      {curriculo.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurriculo(null)}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 p-3 hover:border-[#F5C518] transition-colors">
                    <FileText className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm text-neutral-500">Enviar currículo (PDF)</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setCurriculo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex flex-col items-center gap-3 pt-2 pb-10">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 px-10 py-3 text-base h-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar cadastro'
              )}
            </Button>
            <p className="text-xs text-neutral-400 text-center max-w-md">
              Ao enviar, você concorda em ter suas informações armazenadas no banco de talentos da
              Lazuli para futuras oportunidades.
            </p>
          </div>
        </form>

        <div className="text-center pb-10">
          <Link to="/" className="text-xs text-neutral-400 hover:text-neutral-600">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
