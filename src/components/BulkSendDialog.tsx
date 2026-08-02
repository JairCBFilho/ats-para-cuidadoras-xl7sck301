import { useState, useEffect } from 'react'
import { bulkSend } from '@/services/bulk-send'
import { getEmailTemplates, type EmailTemplate } from '@/services/email-templates'
import { getConfiguracoes } from '@/services/configuracoes'
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
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidataIds: string[]
  vagaId: string
}

const STAGES = ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada'] as const

export function BulkSendDialog({ open, onOpenChange, candidataIds, vagaId }: Props) {
  const [etapa, setEtapa] = useState<string>('Triagem')
  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email')
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) {
      getConfiguracoes()
        .then((c) => {
          if (c) setCanal(c.canal_manual)
        })
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      getEmailTemplates()
        .then((tpls) => {
          const t = tpls.find((t) => t.etapa === etapa && t.canal === canal)
          setTemplate(t || null)
        })
        .catch(() => {})
    }
  }, [open, etapa, canal])

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await bulkSend({ candidataIds, vagaId, etapa, canal })
      const successCount = res.results.filter((r) => r.success).length
      if (canal === 'whatsapp') {
        res.results.filter((r) => r.link).forEach((r) => window.open(r.link, '_blank'))
        toast.success(`${successCount} links de WhatsApp abertos!`)
      } else {
        toast.success(`${successCount} e-mails enviados!`)
      }
      onOpenChange(false)
    } catch {
      toast.error('Erro ao enviar comunicação')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar comunicação em lote</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {candidataIds.length} candidata(s) selecionada(s)
          </p>
          <div>
            <Label>Etapa</Label>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Canal</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as 'email' | 'whatsapp')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {template && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pré-visualização</p>
              {canal === 'email' && <p className="text-sm font-medium">{template.assunto}</p>}
              <p className="text-sm text-muted-foreground line-clamp-3">{template.corpo}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || candidataIds.length === 0}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
