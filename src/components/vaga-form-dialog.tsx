import { useState, useEffect } from 'react'
import { createVaga, updateVaga, type Vaga } from '@/services/vagas'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaga: Vaga | null
  onSaved: () => void
}

export function VagaFormDialog({ open, onOpenChange, vaga, onSaved }: Props) {
  const [form, setForm] = useState({
    cargo: '',
    localizacao: '',
    turno: '',
    requisitos: '',
    status: 'aberta',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        vaga
          ? {
              cargo: vaga.cargo,
              localizacao: vaga.localizacao,
              turno: vaga.turno,
              requisitos: vaga.requisitos || '',
              status: vaga.status,
            }
          : { cargo: '', localizacao: '', turno: '', requisitos: '', status: 'aberta' },
      )
      setErrors({})
    }
  }, [open, vaga])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!form.cargo.trim()) errs.cargo = 'Cargo é obrigatório'
    if (!form.localizacao.trim()) errs.localizacao = 'Localização é obrigatória'
    if (!form.turno) errs.turno = 'Selecione o turno'
    if (!form.status) errs.status = 'Selecione o status'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      if (vaga) {
        await updateVaga(vaga.id, {
          ...form,
          turno: form.turno as Vaga['turno'],
          status: form.status as Vaga['status'],
        })
        toast.success('Vaga atualizada com sucesso!')
      } else {
        await createVaga({
          ...form,
          turno: form.turno as Vaga['turno'],
          status: form.status as Vaga['status'],
        })
        toast.success('Vaga criada com sucesso!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar vaga')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{vaga ? 'Editar Vaga' : 'Nova Vaga'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cargo">Cargo *</Label>
            <Input
              id="cargo"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            />
            {errors.cargo && <p className="mt-1 text-sm text-destructive">{errors.cargo}</p>}
          </div>
          <div>
            <Label htmlFor="localizacao">Localização *</Label>
            <Input
              id="localizacao"
              value={form.localizacao}
              onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
            />
            {errors.localizacao && (
              <p className="mt-1 text-sm text-destructive">{errors.localizacao}</p>
            )}
          </div>
          <div>
            <Label>Turno *</Label>
            <Select value={form.turno} onValueChange={(v) => setForm({ ...form, turno: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
              </SelectContent>
            </Select>
            {errors.turno && <p className="mt-1 text-sm text-destructive">{errors.turno}</p>}
          </div>
          <div>
            <Label htmlFor="requisitos">Requisitos</Label>
            <Textarea
              id="requisitos"
              value={form.requisitos}
              onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="fechada">Fechada</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="mt-1 text-sm text-destructive">{errors.status}</p>}
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
