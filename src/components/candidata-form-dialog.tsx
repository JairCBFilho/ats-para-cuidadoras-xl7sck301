import { useState, useEffect } from 'react'
import { createCandidata, updateCandidata, type Candidata } from '@/services/candidatas'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
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
}

export function CandidataFormDialog({ open, onOpenChange, candidata, onSaved }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

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
            }
          : defaultForm,
      )
      setErrors({})
    }
  }, [open, candidata])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório'
    if (form.telefone && !/^[0-9+ ]+$/.test(form.telefone)) {
      errs.telefone = 'Telefone deve conter apenas números, + e espaços'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      if (candidata) {
        await updateCandidata(candidata.id, form)
        toast.success('Candidata atualizada com sucesso!')
      } else {
        await createCandidata(form)
        toast.success('Candidata criada com sucesso!')
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{candidata ? 'Editar Candidata' : 'Nova Candidata'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {ORIGEM_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
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
