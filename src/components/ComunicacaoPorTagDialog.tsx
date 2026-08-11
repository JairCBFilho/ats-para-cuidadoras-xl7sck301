import { useState, useEffect, useMemo } from 'react'
import {
  Send,
  Mail,
  MessageCircle,
  Tag,
  Loader2,
  Pause,
  Play,
  SkipForward,
  X,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
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
import { getCuidadores, parseTags, SUGGESTED_TAGS, type Cuidador } from '@/services/cuidadores'
import { getEmailTemplates, ETAPA_LABELS, type EmailTemplate } from '@/services/email-templates'
import { dispararPorTag, type DisparoPorTagEmailResult } from '@/services/disparo-por-tag'
import { useWhatsappQueue } from '@/hooks/use-whatsapp-queue'
import type { BulkSendResult } from '@/services/bulk-send'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { tagColor } from '@/components/TagEditor'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComunicacaoPorTagDialog({ open, onOpenChange }: Props) {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email')
  const [templateId, setTemplateId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [emailResult, setEmailResult] = useState<DisparoPorTagEmailResult | null>(null)
  const queue = useWhatsappQueue()
  const { reset: resetQueue } = queue

  useEffect(() => {
    if (open) {
      getCuidadores()
        .then(setCuidadores)
        .catch(() => {})
      getEmailTemplates()
        .then(setTemplates)
        .catch(() => {})
    } else {
      setSelectedTags([])
      setTemplateId('')
      setEmailResult(null)
      resetQueue()
    }
  }, [open, resetQueue])

  // Tags disponíveis (usadas + sugeridas), sem duplicatas
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    cuidadores.forEach((c) => parseTags(c.tags).forEach((t) => set.add(t)))
    SUGGESTED_TAGS.forEach((t) => set.add(t))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [cuidadores])

  // Pré-contagem de cuidadores alcançados pelas tags selecionadas
  const alvoCount = useMemo(() => {
    if (selectedTags.length === 0) return 0
    const lower = new Set(selectedTags.map((t) => t.toLowerCase()))
    return cuidadores.filter((c) => parseTags(c.tags).some((t) => lower.has(t.toLowerCase())))
      .length
  }, [cuidadores, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag],
    )
  }

  // Templates do canal selecionado
  const templatesCanal = useMemo(
    () => templates.filter((t) => t.canal === canal),
    [templates, canal],
  )

  // Pré-visualização para a primeira cuidadora alvo
  const preview = useMemo(() => {
    if (!templateId) return null
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return null
    const lower = new Set(selectedTags.map((t) => t.toLowerCase()))
    const primeiro = cuidadores.find((c) =>
      parseTags(c.tags).some((t) => lower.has(t.toLowerCase())),
    )
    const nome = primeiro?.nome || '{nome_candidata}'
    const assunto = tpl.assunto
      .replace(/{nome_candidata}/g, nome)
      .replace(/{nome_vaga}/g, '')
      .replace(/{cargo}/g, '')
      .replace(/{etapa}/g, '')
      .replace(/{data_entrevista}/g, 'data a confirmar')
    const corpo = tpl.corpo
      .replace(/{nome_candidata}/g, nome)
      .replace(/{nome_vaga}/g, '')
      .replace(/{cargo}/g, '')
      .replace(/{etapa}/g, '')
      .replace(/{data_entrevista}/g, 'data a confirmar')
    return { assunto, corpo }
  }, [templateId, templates, cuidadores, selectedTags])

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await dispararPorTag({ tags: selectedTags, canal, templateId })
      if (canal === 'whatsapp') {
        const links = (res as { results: BulkSendResult[]; total: number }).results.filter(
          (r) => r.success && r.link,
        )
        if (links.length === 0) {
          toast.error('Nenhum link de WhatsApp gerado')
          return
        }
        queue.start(links)
      } else {
        setEmailResult(res as DisparoPorTagEmailResult)
      }
    } catch {
      toast.error('Erro ao disparar comunicação')
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

  const canSend = selectedTags.length > 0 && templateId && !sending && alvoCount > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isActive
              ? 'Envio sequencial de WhatsApp'
              : emailResult
                ? 'Disparo por e-mail concluído'
                : 'Comunicação por Tag'}
          </DialogTitle>
        </DialogHeader>

        {emailResult ? (
          <>
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">
                {emailResult.enviados}{' '}
                {emailResult.enviados === 1 ? 'e-mail enviado' : 'e-mails enviados'}
              </p>
              <p className="text-sm text-muted-foreground">
                de {emailResult.total} cuidadora(s) com as tags selecionadas
              </p>
              {emailResult.erros.length > 0 && (
                <div className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    {emailResult.erros.length} falha(s)
                  </p>
                  <ul className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                    {emailResult.erros.slice(0, 5).map((e, i) => (
                      <li key={i}>
                        {e.nome}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : !isActive ? (
          <>
            <div className="space-y-4">
              {/* Seleção de tags */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Tags
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecione uma ou mais tags para alcançar todas as cuidadoras que as possuam.
                </p>
                {availableTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tag disponível.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {availableTags.map((t) => {
                      const active = selectedTags.some((s) => s.toLowerCase() === t.toLowerCase())
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
                            active
                              ? cn(tagColor(t), 'ring-2 ring-primary/40')
                              : 'border-input bg-background hover:bg-accent',
                          )}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Contagem de alcançados */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">
                  <span className="font-bold">{alvoCount}</span>{' '}
                  {alvoCount === 1 ? 'cuidadora' : 'cuidadoras'} com as tags selecionadas
                </p>
              </div>

              {/* Canal */}
              <div>
                <Label>Canal</Label>
                <Select
                  value={canal}
                  onValueChange={(v) => {
                    setCanal(v as 'email' | 'whatsapp')
                    setTemplateId('')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> E-mail
                      </span>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template */}
              <div>
                <Label>Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesCanal.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        Nenhum template para este canal
                      </SelectItem>
                    ) : (
                      templatesCanal.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {ETAPA_LABELS[t.etapa as keyof typeof ETAPA_LABELS] || t.etapa} —{' '}
                          {t.assunto || '(sem assunto)'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Pré-visualização */}
              {preview && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Pré-visualização</p>
                  {canal === 'email' && (
                    <p className="text-sm font-medium mb-1">{preview.assunto}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                    {preview.corpo}
                  </p>
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
              <Button onClick={handleSend} disabled={!canSend}>
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Disparar
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

/** Badge resumido das tags selecionadas (para uso externo, se necessário) */
export function SelectedTagsBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge key={t} variant="secondary" className={cn('text-[10px]', tagColor(t))}>
          {t}
        </Badge>
      ))}
    </div>
  )
}
