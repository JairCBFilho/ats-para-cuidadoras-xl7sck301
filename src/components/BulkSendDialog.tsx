import { useState, useEffect } from 'react'
import { bulkSend } from '@/services/bulk-send'
import { getEmailTemplates, ETAPA_LABELS, type EmailTemplate } from '@/services/email-templates'
import { getConfiguracoes } from '@/services/configuracoes'
import { useWhatsappQueue } from '@/hooks/use-whatsapp-queue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Send,
  Pause,
  Play,
  SkipForward,
  X,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidataIds: string[]
  vagaId: string
}

const STAGES = [
  'Triagem',
  'Entrevista',
  'Aprovada',
  'Rejeitada',
  'AtualizacaoCadastro',
  'VerificacaoDisponibilidade',
] as const

export function BulkSendDialog({ open, onOpenChange, candidataIds, vagaId }: Props) {
  const [etapa, setEtapa] = useState<string>('Triagem')
  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email')
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [sending, setSending] = useState(false)
  const queue = useWhatsappQueue()
  const { reset: resetQueue } = queue

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

  useEffect(() => {
    if (!open) resetQueue()
  }, [open, resetQueue])

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await bulkSend({ candidataIds, vagaId, etapa, canal })
      if (canal === 'whatsapp') {
        const links = res.results.filter((r) => r.success && r.link)
        if (links.length === 0) {
          toast.error('Nenhum link de WhatsApp gerado')
          return
        }
        queue.start(links)
      } else {
        const count = res.results.filter((r) => r.success).length
        toast.success(`${count} e-mails enviados!`)
        onOpenChange(false)
      }
    } catch {
      toast.error('Erro ao enviar comunicação')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    queue.reset()
    onOpenChange(false)
  }

  const isActive = queue.queueState !== 'idle'
  const isDone = queue.queueState === 'completed'
  const progress = isDone
    ? 100
    : queue.totalLinks > 0
      ? ((queue.currentIndex + 1) / queue.totalLinks) * 100
      : 0
  const skipped = queue.totalLinks - queue.openedCount

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isActive ? 'Envio sequencial de WhatsApp' : 'Enviar comunicação em lote'}
          </DialogTitle>
        </DialogHeader>

        {!isActive ? (
          <>
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
                        {ETAPA_LABELS[s as keyof typeof ETAPA_LABELS]}
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
              {canal === 'whatsapp' && (
                <p className="text-xs text-muted-foreground">
                  Os links serão abertos um por vez, com pausa de 3 segundos entre cada envio.
                </p>
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
          </>
        ) : isDone ? (
          <>
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">
                {queue.openedCount} {queue.openedCount === 1 ? 'link aberto' : 'links abertos'}
              </p>
              {skipped > 0 && <p className="text-sm text-muted-foreground">{skipped} pulado(s)</p>}
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Abrindo link {queue.currentIndex + 1} de {queue.totalLinks}
                  </span>
                  <span className="text-muted-foreground">{queue.openedCount} aberto(s)</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              {queue.popupBlocked ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3 dark:border-amber-700 dark:bg-amber-950/40">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      O navegador bloqueou a abertura da aba. Clique no botão abaixo para abrir o
                      WhatsApp manualmente.
                    </p>
                  </div>
                  <Button onClick={queue.manualOpen} className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir WhatsApp
                  </Button>
                </div>
              ) : queue.queueState === 'processing' ? (
                <p className="text-sm text-muted-foreground text-center">
                  Aguardando 3 segundos antes do próximo link...
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Envio pausado. Clique em continuar para retomar.
                </p>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              {!queue.popupBlocked && queue.queueState === 'processing' && (
                <Button variant="outline" onClick={queue.pause} className="flex-1">
                  <Pause className="mr-2 h-4 w-4" /> Pausar
                </Button>
              )}
              {!queue.popupBlocked && queue.queueState === 'paused' && (
                <Button variant="outline" onClick={queue.resume} className="flex-1">
                  <Play className="mr-2 h-4 w-4" /> Continuar
                </Button>
              )}
              <Button variant="secondary" onClick={queue.skip} className="flex-1">
                <SkipForward className="mr-2 h-4 w-4" /> Pular
              </Button>
              <Button variant="destructive" onClick={queue.cancel} className="flex-1">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
