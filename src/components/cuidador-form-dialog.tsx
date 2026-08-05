import { useState, useEffect } from 'react'
import {
  createCuidador,
  updateCuidador,
  type Cuidador,
  type CuidadorInput,
} from '@/services/cuidadores'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { FotoUpload } from '@/components/foto-upload'
import { CurriculoUpload } from '@/components/CurriculoUpload'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const ORIGEM_OPTIONS = ['Indicação', 'LinkedIn', 'Instagram', 'Site', 'WhatsApp', 'Outro']
const DISPONIBILIDADE_OPTIONS = ['disponível', 'indisponível']
const TURNO_OPTIONS = ['12h', '24h']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuidador: Cuidador | null
  onSaved: () => void
}

const defaultForm = {
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
      const data: CuidadorInput = { ...form }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div>
            <Label htmlFor="c-nome">Nome *</Label>
            <Input
              id="c-nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div>
            <Label htmlFor="c-email">E-mail *</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-tel">Telefone</Label>
              <Input
                id="c-tel"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <div>
              <Label>Origem</Label>
              <Select
                value={form.origem || undefined}
                onValueChange={(v) => setForm({ ...form, origem: v })}
              >
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Disponibilidade</Label>
              <Select
                value={form.disponibilidade || undefined}
                onValueChange={(v) => setForm({ ...form, disponibilidade: v })}
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
              <Select
                value={form.turno || undefined}
                onValueChange={(v) => setForm({ ...form, turno: v })}
              >
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
          <div>
            <Label htmlFor="c-form">Formação</Label>
            <Input
              id="c-form"
              value={form.formacao}
              onChange={(e) => setForm({ ...form, formacao: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-loc">Localização</Label>
            <Input
              id="c-loc"
              value={form.localizacao}
              onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-esp">Especialidades</Label>
            <Input
              id="c-esp"
              value={form.especialidades}
              placeholder="Ex: Cuidados paliativos, Alzheimer..."
              onChange={(e) => setForm({ ...form, especialidades: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-exp">Experiência</Label>
            <Textarea
              id="c-exp"
              value={form.experiencia}
              onChange={(e) => setForm({ ...form, experiencia: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="c-li">LinkedIn (URL)</Label>
            <Input
              id="c-li"
              value={form.linkedin}
              placeholder="https://linkedin.com/in/..."
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            />
            {errors.linkedin && <p className="mt-1 text-sm text-destructive">{errors.linkedin}</p>}
          </div>
          <div>
            <Label htmlFor="c-port">Portfólio (URL)</Label>
            <Input
              id="c-port"
              value={form.portfolio}
              placeholder="https://..."
              onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
            />
            {errors.portfolio && (
              <p className="mt-1 text-sm text-destructive">{errors.portfolio}</p>
            )}
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
