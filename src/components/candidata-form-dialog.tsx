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
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidata: Candidata | null
  onSaved: () => void
}

export function CandidataFormDialog({ open, onOpenChange, candidata, onSaved }: Props) {
  const [form, setForm] = useState({ nome: '', formacao: '', localizacao: '', experiencia: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        candidata
          ? {
              nome: candidata.nome,
              formacao: candidata.formacao || '',
              localizacao: candidata.localizacao || '',
              experiencia: candidata.experiencia || '',
            }
          : { nome: '', formacao: '', localizacao: '', experiencia: '' },
      )
      setErrors({})
    }
  }, [open, candidata])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
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
