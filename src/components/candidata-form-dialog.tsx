import { useState, useEffect } from 'react'
import {
  createCandidata,
  updateCandidata,
  type Candidata,
  type CandidataInput,
} from '@/services/candidatas'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidata: Candidata | null
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
}

export function CandidataFormDialog({ open, onOpenChange, candidata, onSaved }: Props) {
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
        candidata
          ? {
              nome: candidata.nome,
              email: candidata.email || '',
              formacao: candidata.formacao || '',
              localizacao: candidata.localizacao || '',
              experiencia: candidata.experiencia || '',
              telefone: candidata.telefone || '',
              origem: candidata.origem || '',
              linkedin: candidata.linkedin || '',
              portfolio: candidata.portfolio || '',
            }
          : defaultForm,
      )
      setErrors({})
      setSelectedFile(null)
      setFotoRemoved(false)
      setSelectedCurriculo(null)
      setCurriculoRemoved(false)
    }
  }, [open, candidata])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório'
    if (form.telefone && !/^[0-9+ ]+$/.test(form.telefone)) errs.telefone = 'Telefone inválido'
    if (form.linkedin && !/^https?:\/\//.test(form.linkedin)) errs.linkedin = 'URL inválida'
    if (form.portfolio && !/^https?:\/\//.test(form.portfolio)) errs.portfolio = 'URL inválida'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const data: CandidataInput = { ...form }
      if (selectedFile) data.foto = selectedFile
      else if (fotoRemoved) data.foto = null
      if (selectedCurriculo) data.curriculo = selectedCurriculo
      else if (curriculoRemoved) data.curriculo = null
      if (candidata) {
        await updateCandidata(candidata.id, data)
        toast.success('Candidata atualizada!')
      } else {
        await createCandidata(data)
        toast.success('Candidata criada!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar candidata')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidata ? 'Editar Candidata' : 'Nova Candidata'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FotoUpload
            record={candidata}
            foto={candidata?.foto}
            onChange={(file) => {
              setSelectedFile(file)
              setFotoRemoved(!file)
            }}
          />
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
            <Input
              id="telefone"
              value={form.telefone}
              placeholder="+55 11 98123-4567"
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
            {errors.telefone && <p className="mt-1 text-sm text-destructive">{errors.telefone}</p>}
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
          <div>
            <Label htmlFor="formacao">Formação</Label>
            <Input
              id="formacao"
              value={form.formacao}
              onChange={(e) => setForm({ ...form, formacao: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="localizacao">Localização</Label>
            <Input
              id="localizacao"
              value={form.localizacao}
              onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="experiencia">Experiência</Label>
            <Textarea
              id="experiencia"
              value={form.experiencia}
              onChange={(e) => setForm({ ...form, experiencia: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn (URL)</Label>
            <Input
              id="linkedin"
              value={form.linkedin}
              placeholder="https://linkedin.com/in/..."
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            />
            {errors.linkedin && <p className="mt-1 text-sm text-destructive">{errors.linkedin}</p>}
          </div>
          <div>
            <Label htmlFor="portfolio">Portfólio (URL)</Label>
            <Input
              id="portfolio"
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
              record={candidata}
              curriculo={candidata?.curriculo}
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
