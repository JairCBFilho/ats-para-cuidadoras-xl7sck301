import { useState, useEffect } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import {
  createEntrevista,
  updateEntrevista,
  type Entrevista,
  type StatusEntrevista,
} from '@/services/entrevistas'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  onSaved: () => void
  entrevista?: Entrevista | null
  preselectCandidata?: string
}

export function EntrevistaFormDialog({
  open,
  onOpenChange,
  onSaved,
  entrevista,
  preselectCandidata,
}: Props) {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [form, setForm] = useState({
    candidata: '',
    vaga: '',
    data_hora: '',
    status: 'agendada' as StatusEntrevista,
    observacoes: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      getVagas()
        .then(setVagas)
        .catch(() => {})
      getCandidatas()
        .then(setCandidatas)
        .catch(() => {})
      setForm(
        entrevista
          ? {
              candidata: entrevista.candidata,
              vaga: entrevista.vaga,
              data_hora: entrevista.data_hora ? entrevista.data_hora.slice(0, 16) : '',
              status: entrevista.status,
              observacoes: entrevista.observacoes || '',
            }
          : {
              candidata: preselectCandidata || '',
              vaga: '',
              data_hora: '',
              status: 'agendada',
              observacoes: '',
            },
      )
      setErrors({})
    }
  }, [open, entrevista, preselectCandidata])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!form.candidata) errs.candidata = 'Selecione uma candidata'
    if (!form.vaga) errs.vaga = 'Selecione uma vaga'
    if (!form.data_hora) errs.data_hora = 'Data e hora são obrigatórias'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      if (entrevista) {
        await updateEntrevista(entrevista.id, form)
        toast.success('Entrevista atualizada!')
      } else {
        await createEntrevista(form)
        toast.success('Entrevista criada!')
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar entrevista')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entrevista ? 'Editar Entrevista' : 'Nova Entrevista'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Candidata *</Label>
            <Select
              value={form.candidata || undefined}
              onValueChange={(v) => setForm({ ...form, candidata: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {candidatas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.candidata && (
              <p className="mt-1 text-sm text-destructive">{errors.candidata}</p>
            )}
          </div>
          <div>
            <Label>Vaga *</Label>
            <Select
              value={form.vaga || undefined}
              onValueChange={(v) => setForm({ ...form, vaga: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {vagas.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vaga && <p className="mt-1 text-sm text-destructive">{errors.vaga}</p>}
          </div>
          <div>
            <Label htmlFor="data_hora">Data e hora *</Label>
            <Input
              id="data_hora"
              type="datetime-local"
              value={form.data_hora}
              onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
            />
            {errors.data_hora && (
              <p className="mt-1 text-sm text-destructive">{errors.data_hora}</p>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as StatusEntrevista })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={2}
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
