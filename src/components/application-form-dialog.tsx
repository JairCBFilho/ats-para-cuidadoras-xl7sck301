import { useState, useEffect } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import { createApplication } from '@/services/applications'
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
}

export function ApplicationFormDialog({ open, onOpenChange, onSaved }: Props) {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [vagaId, setVagaId] = useState('')
  const [candidataId, setCandidataId] = useState('')
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
      setVagaId('')
      setCandidataId('')
      setErrors({})
    }
  }, [open])

  const submit = async () => {
    const errs: FieldErrors = {}
    if (!vagaId) errs.vaga = 'Selecione uma vaga'
    if (!candidataId) errs.candidata = 'Selecione uma candidata'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await createApplication({ vaga: vagaId, candidata: candidataId, etapa: 'Triagem' })
      toast.success('Candidatura criada com sucesso!')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao criar candidatura')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Candidatura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Vaga *</Label>
            <Select value={vagaId} onValueChange={setVagaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma vaga" />
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
            <Label>Candidata *</Label>
            <Select value={candidataId} onValueChange={setCandidataId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma candidata" />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Salvando...' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
