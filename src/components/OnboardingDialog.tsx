import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  createOnboarding,
  updateOnboarding,
  type Onboarding,
  type StatusOnboarding,
  type CategoriaOnboarding,
} from '@/services/onboarding'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface OnboardingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidataId: string
  onboarding?: Onboarding | null
}

const defaultForm = {
  tarefa: '',
  categoria: 'Documentação' as CategoriaOnboarding,
  status: 'pendente' as StatusOnboarding,
}

export function OnboardingDialog({
  open,
  onOpenChange,
  candidataId,
  onboarding,
}: OnboardingDialogProps) {
  const [formData, setFormData] = useState(defaultForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData(
        onboarding
          ? {
              tarefa: onboarding.tarefa,
              categoria: onboarding.categoria,
              status: onboarding.status,
            }
          : defaultForm,
      )
      setFieldErrors({})
    }
  }, [open, onboarding])

  const handleSubmit = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = { ...formData, candidata: candidataId }
      if (onboarding) {
        await updateOnboarding(onboarding.id, payload)
        toast.success('Tarefa atualizada com sucesso!')
      } else {
        await createOnboarding(payload)
        toast.success('Tarefa criada com sucesso!')
      }
      onOpenChange(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{onboarding ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ob-tarefa">Tarefa *</Label>
            <Input
              id="ob-tarefa"
              value={formData.tarefa}
              onChange={(e) => setFormData({ ...formData, tarefa: e.target.value })}
            />
            {fieldErrors.tarefa && <p className="text-sm text-red-500">{fieldErrors.tarefa}</p>}
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(v) =>
                setFormData({ ...formData, categoria: v as CategoriaOnboarding })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Documentação">Documentação</SelectItem>
                <SelectItem value="Treinamento">Treinamento</SelectItem>
                <SelectItem value="Contrato">Contrato</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as StatusOnboarding })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
