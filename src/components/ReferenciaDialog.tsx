import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  createReferencia,
  updateReferencia,
  type Referencia,
  type StatusReferencia,
} from '@/services/referencias'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface ReferenciaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidataId: string
  referencia?: Referencia | null
}

const defaultForm = {
  nome: '',
  contato: '',
  relacionamento: '',
  status: 'pendente' as StatusReferencia,
  observacoes: '',
}

export function ReferenciaDialog({
  open,
  onOpenChange,
  candidataId,
  referencia,
}: ReferenciaDialogProps) {
  const [formData, setFormData] = useState(defaultForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFormData(
        referencia
          ? {
              nome: referencia.nome,
              contato: referencia.contato,
              relacionamento: referencia.relacionamento || '',
              status: referencia.status,
              observacoes: referencia.observacoes || '',
            }
          : defaultForm,
      )
      setFieldErrors({})
    }
  }, [open, referencia])

  const handleSubmit = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = { ...formData, candidata: candidataId }
      if (referencia) {
        await updateReferencia(referencia.id, payload)
        toast.success('Referência atualizada com sucesso!')
      } else {
        await createReferencia(payload)
        toast.success('Referência criada com sucesso!')
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
          <DialogTitle>{referencia ? 'Editar Referência' : 'Nova Referência'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ref-nome">Nome *</Label>
            <Input
              id="ref-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
            {fieldErrors.nome && <p className="text-sm text-red-500">{fieldErrors.nome}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-contato">Contato *</Label>
            <Input
              id="ref-contato"
              value={formData.contato}
              placeholder="Telefone ou e-mail"
              onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
            />
            {fieldErrors.contato && <p className="text-sm text-red-500">{fieldErrors.contato}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-rel">Relacionamento</Label>
            <Input
              id="ref-rel"
              value={formData.relacionamento}
              placeholder="Ex: Ex-empregadora, vizinha"
              onChange={(e) => setFormData({ ...formData, relacionamento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as StatusReferencia })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-obs">Observações</Label>
            <Textarea
              id="ref-obs"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
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
