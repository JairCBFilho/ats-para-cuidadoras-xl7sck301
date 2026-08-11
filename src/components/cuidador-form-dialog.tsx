import { useState, useEffect } from 'react'
import {
  createCuidador,
  updateCuidador,
  parseTags,
  stringifyTags,
  SUGGESTED_TAGS,
  type Cuidador,
  type CuidadorInput,
} from '@/services/cuidadores'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { FotoUpload } from '@/components/foto-upload'
import { CurriculoUpload } from '@/components/CurriculoUpload'
import { DatePicker } from '@/components/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'

const ORIGEM_OPTIONS = ['Indicação', 'LinkedIn', 'Instagram', 'Site', 'WhatsApp', 'Outro']
const DISPONIBILIDADE_OPTIONS = ['disponível', 'indisponível']
const TURNO_OPTIONS = ['12h', '24h']
const SEXO_OPTIONS = ['Feminino', 'Masculino', 'Outro']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuidador: Cuidador | null
  onSaved: () => void
}

const defaultForm = {
  // Existentes
  nome: '',
  email: '',
  formacao: '',
  localizacao: '',
  experiencia: '',
  telefone: '',
  origem: '',
  linkedin: '',
  portfolio: '',
  disponibilidade: 'disponível',
  especialidades: '',
  turno: '',
  // Dados pessoais
  codigo: '' as '' | number,
  data_cadastro: '',
  nascimento: '',
  cpf: '',
  identidade: '',
  sexo: '',
  // Contato
  celular: '',
  endereco: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  // Formação
  curso_cuidador: '',
  carga_horaria_curso: '',
  outros_cursos_experiencias: '',
  // Experiência
  tempo_experiencia: '',
  referencias: '',
  experiencia_ilp: '',
  // Saúde e disponibilidade
  vacina_covid: '',
  restricao_fisica: '',
  disponibilidade_horario: '',
  inicio_imediato: '',
  // Documentos
  certific: '',
  declaracao: '',
  // Tags
  tags: '',
}

/** Título de seção com separador visual */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <Separator className="mb-3" />
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
    </div>
  )
}

export function CuidadorFormDialog({ open, onOpenChange, cuidador, onSaved }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fotoRemoved, setFotoRemoved] = useState(false)
  const [selectedCurriculo, setSelectedCurriculo] = useState<File | null>(null)
  const [curriculoRemoved, setCurriculoRemoved] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        cuidador
          ? {
              // Existentes
              nome: cuidador.nome,
              email: cuidador.email || '',
              formacao: cuidador.formacao || '',
              localizacao: cuidador.localizacao || '',
              experiencia: cuidador.experiencia || '',
              telefone: cuidador.telefone || '',
              origem: cuidador.origem || '',
              linkedin: cuidador.linkedin || '',
              portfolio: cuidador.portfolio || '',
              disponibilidade: cuidador.disponibilidade || 'disponível',
              especialidades: cuidador.especialidades || '',
              turno: cuidador.turno || '',
              // Dados pessoais
              codigo: cuidador.codigo ?? '',
              data_cadastro: cuidador.data_cadastro || '',
              nascimento: cuidador.nascimento || '',
              cpf: cuidador.cpf || '',
              identidade: cuidador.identidade || '',
              sexo: cuidador.sexo || '',
              // Contato
              celular: cuidador.celular || '',
              endereco: cuidador.endereco || '',
              bairro: cuidador.bairro || '',
              cidade: cuidador.cidade || '',
              uf: cuidador.uf || '',
              cep: cuidador.cep || '',
              // Formação
              curso_cuidador: cuidador.curso_cuidador || '',
              carga_horaria_curso: cuidador.carga_horaria_curso || '',
              outros_cursos_experiencias: cuidador.outros_cursos_experiencias || '',
              // Experiência
              tempo_experiencia: cuidador.tempo_experiencia || '',
              referencias: cuidador.referencias || '',
              experiencia_ilp: cuidador.experiencia_ilp || '',
              // Saúde e disponibilidade
              vacina_covid: cuidador.vacina_covid || '',
              restricao_fisica: cuidador.restricao_fisica || '',
              disponibilidade_horario: cuidador.disponibilidade_horario || '',
              inicio_imediato: cuidador.inicio_imediato || '',
              // Documentos
              certific: cuidador.certific || '',
              declaracao: cuidador.declaracao || '',
              // Tags
              tags: cuidador.tags || '',
            }
          : defaultForm,
      )
      setErrors({})
      setSelectedFile(null)
      setFotoRemoved(false)
      setSelectedCurriculo(null)
      setCurriculoRemoved(false)
    }
  }, [open, cuidador])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório'
    if (form.linkedin && !/^https?:\/\//.test(form.linkedin)) errs.linkedin = 'URL inválida'
    if (form.portfolio && !/^https?:\/\//.test(form.portfolio)) errs.portfolio = 'URL inválida'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      //codigo: envia somente se preenchido (number ou vazio)
      const { codigo, ...rest } = form
      const data: CuidadorInput = { ...rest }
      if (codigo !== '' && codigo !== null && codigo !== undefined) {
        data.codigo = Number(codigo)
      }
      // Limpa strings de data vazias para não enviar datas inválidas
      if (!data.data_cadastro) delete (data as Record<string, unknown>).data_cadastro
      if (!data.nascimento) delete (data as Record<string, unknown>).nascimento

      if (selectedFile) data.foto = selectedFile
      else if (fotoRemoved) data.foto = null
      if (selectedCurriculo) data.curriculo = selectedCurriculo
      else if (curriculoRemoved) data.curriculo = null

      if (cuidador) {
        await updateCuidador(cuidador.id, data)
        toast.success('Cuidador atualizado!')
      } else {
        await createCuidador(data)
        toast.success('Cuidador criado!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar cuidador')
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const currentTags = parseTags(form.tags)
  const addTag = (t: string) => set('tags', stringifyTags([...currentTags, t]))
  const removeTag = (t: string) => set('tags', stringifyTags(currentTags.filter((x) => x !== t)))
  const suggestions = SUGGESTED_TAGS.filter(
    (s) => !currentTags.some((x) => x.toLowerCase() === s.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cuidador ? 'Editar Cuidador' : 'Novo Cuidador'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FotoUpload
            record={cuidador}
            foto={cuidador?.foto}
            onChange={(file) => {
              setSelectedFile(file)
              setFotoRemoved(!file)
            }}
          />

          {/* Dados Pessoais */}
          <SectionTitle>Dados Pessoais</SectionTitle>
          <div>
            <Label htmlFor="c-nome">Nome *</Label>
            <Input id="c-nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
            {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div>
            <Label htmlFor="c-email">E-mail *</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-codigo">Código</Label>
              <Input
                id="c-codigo"
                type="number"
                value={form.codigo === '' ? '' : String(form.codigo)}
                onChange={(e) => set('codigo', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="c-dt-cadastro">Data de cadastro</Label>
              <DatePicker
                id="c-dt-cadastro"
                value={form.data_cadastro}
                onChange={(iso) => set('data_cadastro', iso)}
                placeholder="Selecione"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-nascimento">Nascimento</Label>
              <DatePicker
                id="c-nascimento"
                value={form.nascimento}
                onChange={(iso) => set('nascimento', iso)}
                placeholder="Selecione"
              />
            </div>
            <div>
              <Label htmlFor="c-sexo">Sexo</Label>
              <Select value={form.sexo || undefined} onValueChange={(v) => set('sexo', v)}>
                <SelectTrigger id="c-sexo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SEXO_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-cpf">CPF</Label>
              <Input
                id="c-cpf"
                value={form.cpf}
                placeholder="Somente dígitos"
                onChange={(e) => set('cpf', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-identidade">Identidade (RG)</Label>
              <Input
                id="c-identidade"
                value={form.identidade}
                onChange={(e) => set('identidade', e.target.value)}
              />
            </div>
          </div>

          {/* Contato */}
          <SectionTitle>Contato</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-telefone">Telefone</Label>
              <Input
                id="c-telefone"
                value={form.telefone}
                onChange={(e) => set('telefone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-celular">Celular</Label>
              <Input
                id="c-celular"
                value={form.celular}
                onChange={(e) => set('celular', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-endereco">Endereço</Label>
            <Input
              id="c-endereco"
              value={form.endereco}
              onChange={(e) => set('endereco', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-bairro">Bairro</Label>
              <Input
                id="c-bairro"
                value={form.bairro}
                onChange={(e) => set('bairro', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-cidade">Cidade</Label>
              <Input
                id="c-cidade"
                value={form.cidade}
                onChange={(e) => set('cidade', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-uf">UF</Label>
              <Input
                id="c-uf"
                value={form.uf}
                maxLength={2}
                onChange={(e) => set('uf', e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <Label htmlFor="c-cep">CEP</Label>
              <Input id="c-cep" value={form.cep} onChange={(e) => set('cep', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="c-loc">Localização</Label>
            <Input
              id="c-loc"
              value={form.localizacao}
              placeholder="Cidade/UF"
              onChange={(e) => set('localizacao', e.target.value)}
            />
          </div>

          {/* Formação */}
          <SectionTitle>Formação</SectionTitle>
          <div>
            <Label htmlFor="c-form">Formação (escolaridade)</Label>
            <Input
              id="c-form"
              value={form.formacao}
              onChange={(e) => set('formacao', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-curso-cuidador">Curso de cuidador</Label>
              <Input
                id="c-curso-cuidador"
                value={form.curso_cuidador}
                onChange={(e) => set('curso_cuidador', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-carga-horaria">Carga horária do curso</Label>
              <Input
                id="c-carga-horaria"
                value={form.carga_horaria_curso}
                onChange={(e) => set('carga_horaria_curso', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-outros-cursos">Outros cursos ou experiências</Label>
            <Textarea
              id="c-outros-cursos"
              value={form.outros_cursos_experiencias}
              rows={3}
              onChange={(e) => set('outros_cursos_experiencias', e.target.value)}
            />
          </div>

          {/* Experiência */}
          <SectionTitle>Experiência</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-tempo-exp">Tempo de experiência</Label>
              <Input
                id="c-tempo-exp"
                value={form.tempo_experiencia}
                onChange={(e) => set('tempo_experiencia', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-exp-ilp">Experiência ILP</Label>
              <Input
                id="c-exp-ilp"
                value={form.experiencia_ilp}
                onChange={(e) => set('experiencia_ilp', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-exp">Experiência (resumo)</Label>
            <Textarea
              id="c-exp"
              value={form.experiencia}
              rows={3}
              onChange={(e) => set('experiencia', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="c-referencias">Referências</Label>
            <Textarea
              id="c-referencias"
              value={form.referencias}
              rows={3}
              onChange={(e) => set('referencias', e.target.value)}
            />
          </div>

          {/* Saúde e Disponibilidade */}
          <SectionTitle>Saúde e Disponibilidade</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-vacina-covid">Vacina COVID-19</Label>
              <Input
                id="c-vacina-covid"
                value={form.vacina_covid}
                onChange={(e) => set('vacina_covid', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-restricao">Restrição física</Label>
              <Input
                id="c-restricao"
                value={form.restricao_fisica}
                onChange={(e) => set('restricao_fisica', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-disp-horario">Disponibilidade de horário</Label>
              <Input
                id="c-disp-horario"
                value={form.disponibilidade_horario}
                onChange={(e) => set('disponibilidade_horario', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-inicio-imediato">Início imediato</Label>
              <Input
                id="c-inicio-imediato"
                value={form.inicio_imediato}
                onChange={(e) => set('inicio_imediato', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Disponibilidade</Label>
              <Select
                value={form.disponibilidade || undefined}
                onValueChange={(v) => set('disponibilidade', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DISPONIBILIDADE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Turno</Label>
              <Select value={form.turno || undefined} onValueChange={(v) => set('turno', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TURNO_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Demais campos existentes */}
          <SectionTitle>Informações Profissionais</SectionTitle>
          <div>
            <Label>Origem</Label>
            <Select value={form.origem || undefined} onValueChange={(v) => set('origem', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ORIGEM_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="c-esp">Especialidades</Label>
            <Input
              id="c-esp"
              value={form.especialidades}
              placeholder="Ex: Cuidados paliativos, Alzheimer..."
              onChange={(e) => set('especialidades', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-li">LinkedIn (URL)</Label>
              <Input
                id="c-li"
                value={form.linkedin}
                placeholder="https://linkedin.com/in/..."
                onChange={(e) => set('linkedin', e.target.value)}
              />
              {errors.linkedin && (
                <p className="mt-1 text-sm text-destructive">{errors.linkedin}</p>
              )}
            </div>
            <div>
              <Label htmlFor="c-port">Portfólio (URL)</Label>
              <Input
                id="c-port"
                value={form.portfolio}
                placeholder="https://..."
                onChange={(e) => set('portfolio', e.target.value)}
              />
              {errors.portfolio && (
                <p className="mt-1 text-sm text-destructive">{errors.portfolio}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <SectionTitle>Tags / Etiquetas</SectionTitle>
          <div>
            <Label htmlFor="c-tags">Tags (separadas por vírgula)</Label>
            <Input
              id="c-tags"
              value={form.tags}
              placeholder="Ex: plantão 12h, Alzheimer, curativo"
              onChange={(e) => set('tags', e.target.value)}
            />
            {/* Chips de tags atuais (removíveis) */}
            {currentTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {currentTags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-0.5 rounded-full hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {/* Sugestões clicáveis */}
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-input px-1.5 py-0.5 text-[11px] font-medium hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Documentos */}
          <SectionTitle>Documentos</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-certific">Certificação</Label>
              <Input
                id="c-certific"
                value={form.certific}
                onChange={(e) => set('certific', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-declaracao">Declaração</Label>
              <Input
                id="c-declaracao"
                value={form.declaracao}
                onChange={(e) => set('declaracao', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Currículo (PDF)</Label>
            <CurriculoUpload
              record={cuidador}
              curriculo={cuidador?.curriculo}
              onChange={(file) => {
                setSelectedCurriculo(file)
                setCurriculoRemoved(!file)
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
