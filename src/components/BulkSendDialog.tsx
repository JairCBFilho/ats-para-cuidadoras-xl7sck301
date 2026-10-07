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
import { Badge } from '@/components/ui/badge'
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
  SkipForward,
  X,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

  const isActive = queue.queueState === 'processing'
  const isDone = queue.queueState === 'completed'
  const progress = queue.totalLinks > 0 ? ((queue.currentIndex + 1) / queue.totalLinks) * 100 : 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      <DialogContent className="max-w-lg rounded-3xl bg-[#FAF9F5] p-6 border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900">
            {isActive
              ? 'Envio sequencial no WhatsApp'
              : isDone
                ? 'Resumo do envio no WhatsApp'
                : 'Enviar comunicação em lote'}
          </DialogTitle>
        </DialogHeader>

        {queue.queueState === 'idle' ? (
          <>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {candidataIds.length} candidata(s) selecionada(s)
              </p>
              <div>
                <Label>Etapa</Label>
                <Select value={etapa} onValueChange={setEtapa}>
                  <SelectTrigger className="rounded-xl bg-white">
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
                  <SelectTrigger className="rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {template && (
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-3.5 shadow-sm">
                  <p className="text-xs font-semibold text-neutral-500 mb-1">Pré-visualização</p>
                  {canal === 'email' && (
                    <p className="text-sm font-semibold text-neutral-800 mb-1">
                      {template.assunto}
                    </p>
                  )}
                  <p className="text-sm text-neutral-600 line-clamp-3 whitespace-pre-wrap">
                    {template.corpo}
                  </p>
                </div>
              )}
              {canal === 'whatsapp' && (
                <div className="rounded-2xl bg-amber-500/10 border border-[#F5C518]/40 p-3 text-xs text-neutral-800 space-y-1">
                  <p className="font-semibold text-neutral-900">
                    Como funciona o envio sequencial:
                  </p>
                  <p className="text-neutral-700">
                    O envio reutiliza uma <strong>única aba do WhatsApp Web</strong>. A cada
                    cuidadora, você confere a mensagem, aperta Enter no WhatsApp e clica em{' '}
                    <strong>"Próxima"</strong> para carregar o próximo contato.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || candidataIds.length === 0}
                className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {canal === 'whatsapp' ? 'Iniciar disparos' : 'Enviar'}
              </Button>
            </DialogFooter>
          </>
        ) : isDone ? (
          <>
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <h3 className="text-lg font-bold text-neutral-900">Processo concluído</h3>
                <p className="text-xs text-neutral-500">
                  Resumo dos disparos de WhatsApp para as {queue.totalLinks} candidatas
                </p>
              </div>

              {/* Indicadores de status */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                  <p className="text-xs font-medium text-emerald-700">Enviadas</p>
                  <p className="text-2xl font-extrabold text-emerald-900">{queue.enviadasCount}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-100/70 p-3 text-center">
                  <p className="text-xs font-medium text-neutral-600">Puladas</p>
                  <p className="text-2xl font-extrabold text-neutral-800">{queue.puladasCount}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                  <p className="text-xs font-medium text-amber-700">Pendentes</p>
                  <p className="text-2xl font-extrabold text-amber-900">{queue.pendentesCount}</p>
                </div>
              </div>

              {/* Lista dos contatos com status e opção de retomar */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {queue.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/80 bg-white text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900 truncate">
                        {idx + 1}. {item.nome}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {item.telefone || 'Sem telefone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'enviada' && (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                          Enviada
                        </Badge>
                      )}
                      {item.status === 'pulada' && (
                        <Badge variant="secondary" className="text-[10px] text-neutral-600">
                          Pulada
                        </Badge>
                      )}
                      {item.status === 'pendente' && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-700 border-amber-300"
                        >
                          Pendente
                        </Badge>
                      )}
                      {item.status !== 'enviada' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            queue.goTo(idx)
                            queue.openCurrent()
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Retomar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={handleClose}
                className="w-full rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              >
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* queueState === 'processing' */
          <>
            <div className="space-y-4">
              {/* Cabeçalho de progresso */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800">
                    Enviando {queue.currentIndex + 1} de {queue.totalLinks}
                  </span>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <span className="text-emerald-700 font-medium">
                      {queue.enviadasCount} enviadas
                    </span>
                    {queue.puladasCount > 0 && <span>• {queue.puladasCount} puladas</span>}
                  </div>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>

              {/* Cartão da Cuidadora Atual */}
              {queue.currentItem && (
                <div className="rounded-2xl border-2 border-neutral-900 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Candidata atual
                      </span>
                      <h4 className="text-base font-bold text-neutral-900">
                        {queue.currentItem.nome}
                      </h4>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {queue.currentItem.telefone || 'Telefone não informado'}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'text-[10px]',
                        queue.currentItem.status === 'enviada'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : queue.currentItem.status === 'pulada'
                            ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200',
                      )}
                    >
                      {queue.currentItem.status === 'enviada'
                        ? 'Enviada'
                        : queue.currentItem.status === 'pulada'
                          ? 'Pulada'
                          : 'Pendente'}
                    </Badge>
                  </div>

                  <div className="rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-600 border border-neutral-200/60">
                    💡 <strong>Passo a passo:</strong> Clique em{' '}
                    <strong>"Abrir no WhatsApp"</strong>, dê o <strong>Enter</strong> para enviar a
                    mensagem na janela do WhatsApp Web e clique em <strong>"Próxima"</strong> para
                    avançar.
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={queue.openCurrent}
                      className="flex-1 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-medium"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> Abrir no WhatsApp
                    </Button>
                  </div>
                </div>
              )}

              {queue.popupBlocked && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900">
                      O navegador bloqueou a abertura da aba. Clique no botão "Abrir no WhatsApp"
                      acima e permita popups deste site.
                    </p>
                  </div>
                </div>
              )}

              {/* Fila compacta abaixo */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-neutral-500">Próximas da fila</span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {queue.items.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => queue.goTo(idx)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors border',
                        idx === queue.currentIndex
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-200/60 bg-white text-neutral-700 hover:bg-neutral-50',
                      )}
                    >
                      <span className="truncate">
                        {idx + 1}. {item.nome}
                      </span>
                      <span className="text-[10px] shrink-0 ml-2">
                        {item.status === 'enviada'
                          ? '✓ Enviada'
                          : item.status === 'pulada'
                            ? '— Pulada'
                            : '• Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-row items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={queue.skip}
                className="flex-1 rounded-full"
                title="Pula este contato sem marcar como enviado"
              >
                <SkipForward className="mr-1.5 h-3.5 w-3.5" /> Pular
              </Button>
              <Button
                onClick={queue.next}
                className="flex-1 rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              >
                Próxima <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                onClick={queue.cancel}
                className="rounded-full text-neutral-500 hover:text-neutral-800 text-xs px-2.5"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Encerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
