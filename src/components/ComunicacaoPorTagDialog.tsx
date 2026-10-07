import { useState, useEffect, useMemo } from 'react'
import {
  Send,
  Mail,
  MessageCircle,
  Tag,
  Loader2,
  SkipForward,
  X,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
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
import { extractValidWhatsAppLinks, applyTemplateReplacements } from '@/hooks/use-bulk-batch'
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
  const [modo, setModo] = useState<'incluir' | 'excluir'>('incluir')
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
      setModo('incluir')
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

  // Pré-contagem de cuidadores alcançados de acordo com o modo
  const alvoCount = useMemo(() => {
    if (selectedTags.length === 0) {
      return 0
    }
    const lower = new Set(selectedTags.map((t) => t.toLowerCase()))

    if (modo === 'excluir') {
      return cuidadores.filter((c) => !parseTags(c.tags).some((t) => lower.has(t.toLowerCase())))
        .length
    }

    return cuidadores.filter((c) => parseTags(c.tags).some((t) => lower.has(t.toLowerCase())))
      .length
  }, [cuidadores, selectedTags, modo])

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
    const primeiro =
      modo === 'excluir'
        ? cuidadores.find((c) => !parseTags(c.tags).some((t) => lower.has(t.toLowerCase())))
        : cuidadores.find((c) => parseTags(c.tags).some((t) => lower.has(t.toLowerCase())))
    const nome = primeiro?.nome || '{nome_candidata}'
    const assunto = applyTemplateReplacements(tpl.assunto, { nomeCandidata: nome })
    const corpo = applyTemplateReplacements(tpl.corpo, { nomeCandidata: nome })
    return { assunto, corpo }
  }, [templateId, templates, cuidadores, selectedTags, modo])

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await dispararPorTag({ tags: selectedTags, canal, templateId, modo })
      if (canal === 'whatsapp') {
        const rawResults = (res as { results: BulkSendResult[]; total: number }).results || []
        const links = extractValidWhatsAppLinks(rawResults)
        if (links.length === 0) {
          toast.error('Nenhum link de WhatsApp gerado')
          return
        }
        queue.start(links, {
          origem: 'comunicacao-por-tag',
          canal: 'whatsapp',
          tag: selectedTags.join(','),
          templateId,
        })
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

  const isActive = queue.queueState === 'processing'
  const isDone = queue.queueState === 'completed'
  const progress = queue.totalLinks > 0 ? ((queue.currentIndex + 1) / queue.totalLinks) * 100 : 0

  const canSend = selectedTags.length > 0 && templateId && !sending && alvoCount > 0

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
                : emailResult
                  ? 'Disparo por e-mail concluído'
                  : 'Comunicação por Tag'}
          </DialogTitle>
        </DialogHeader>

        {emailResult ? (
          <>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              <p className="text-lg font-bold text-neutral-900">
                {emailResult.enviados}{' '}
                {emailResult.enviados === 1 ? 'e-mail enviado' : 'e-mails enviados'}
              </p>
              <p className="text-xs text-neutral-600">
                de {emailResult.total} cuidadora(s){' '}
                {modo === 'excluir'
                  ? 'alcançadas (todas exceto as tags selecionadas)'
                  : 'com as tags selecionadas'}
              </p>
              {emailResult.erros.length > 0 && (
                <div className="w-full rounded-2xl border border-amber-300 bg-amber-50 p-3 text-left">
                  <p className="text-xs font-semibold text-amber-900">
                    {emailResult.erros.length} falha(s)
                  </p>
                  <ul className="mt-1 text-xs text-amber-800 space-y-0.5">
                    {emailResult.erros.slice(0, 5).map((e, i) => (
                      <li key={i}>
                        {e.nome}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
        ) : queue.queueState === 'idle' ? (
          <>
            <div className="space-y-4">
              {/* Banner de retomada da fila de WhatsApp se existir no localStorage */}
              {queue.hasSavedQueue && queue.savedQueueData && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <RotateCcw className="h-4 w-4 text-amber-700" />
                        Envio em andamento encontrado
                      </p>
                      <p className="text-xs text-amber-900 mt-0.5">
                        Há uma fila com{' '}
                        <strong>{queue.savedQueueData.items.length} destinatários</strong> (
                        {queue.savedQueueData.currentIndex} concluídos) salva anteriormente.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => queue.resumeSavedQueue()}
                      className="rounded-full bg-amber-950 text-white hover:bg-amber-900 text-xs px-3 h-8"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" /> Retomar de onde parei
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => queue.discardSavedQueue()}
                      className="rounded-full text-xs text-amber-900 hover:bg-amber-100 h-8"
                    >
                      Descartar e começar nova
                    </Button>
                  </div>
                </div>
              )}

              {/* Modo de filtro: Incluir vs Excluir */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Modo de disparo
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModo('incluir')}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-2xl border text-left transition-all',
                      modo === 'incluir'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800',
                    )}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Incluir apenas quem tem
                    </span>
                    <span
                      className={cn(
                        'text-[11px] mt-1 leading-tight',
                        modo === 'incluir' ? 'text-neutral-300' : 'text-neutral-500',
                      )}
                    >
                      Dispara para as cuidadoras com as tags selecionadas.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModo('excluir')}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-2xl border text-left transition-all',
                      modo === 'excluir'
                        ? 'border-[#F5C518] bg-[#F5C518]/20 border-2 text-neutral-900 shadow-sm font-medium'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800',
                    )}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>➖</span>
                      Todas menos a selecionada
                    </span>
                    <span className="text-[11px] text-neutral-600 mt-1 leading-tight">
                      Dispara para TODAS, EXCETO quem tem as tags marcadas.
                    </span>
                  </button>
                </div>
              </div>

              {/* Seleção de tags */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Tag className="h-3.5 w-3.5 text-neutral-500" />
                  {modo === 'excluir' ? 'Tags a EXCLUIR do envio' : 'Tags a INCLUIR no envio'}
                </Label>
                <p className="text-[11px] text-neutral-500">
                  {modo === 'excluir'
                    ? 'Selecione as tags que NÃO devem receber a mensagem (ex: "Atualizado", "Reprovado").'
                    : 'Selecione uma ou mais tags para alcançar todas as cuidadoras que as possuam.'}
                </p>
                {availableTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma tag disponível.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border border-neutral-200 rounded-2xl bg-white shadow-inner">
                    {availableTags.map((t) => {
                      const active = selectedTags.some((s) => s.toLowerCase() === t.toLowerCase())
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                            active
                              ? modo === 'excluir'
                                ? 'bg-red-100 text-red-900 border-red-300 ring-2 ring-red-400'
                                : cn(tagColor(t), 'ring-2 ring-neutral-900/40')
                              : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700',
                          )}
                        >
                          {modo === 'excluir' && active && '✕ '}
                          {t}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Contagem de alcançados */}
              <div
                className={cn(
                  'rounded-2xl p-3 border transition-colors',
                  modo === 'excluir'
                    ? 'bg-amber-500/10 border-[#F5C518]/50 text-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-800 shadow-sm',
                )}
              >
                <p className="text-xs">
                  {selectedTags.length === 0 ? (
                    <span className="text-neutral-500">
                      Selecione ao menos uma tag acima para calcular os destinatários.
                    </span>
                  ) : modo === 'excluir' ? (
                    <>
                      <span className="font-bold text-sm text-neutral-950">{alvoCount}</span>{' '}
                      cuidadora(s) serão atingidas{' '}
                      <span className="text-[11px] block text-neutral-600 mt-0.5">
                        (de um total de {cuidadores.length}, excluindo quem possui as{' '}
                        {selectedTags.length} tag(s) selecionada(s))
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-sm text-neutral-950">{alvoCount}</span>{' '}
                      {alvoCount === 1 ? 'cuidadora' : 'cuidadoras'} com as tags selecionadas
                    </>
                  )}
                </p>
              </div>

              {/* Canal */}
              <div>
                <Label className="text-xs font-semibold">Canal</Label>
                <Select
                  value={canal}
                  onValueChange={(v) => {
                    setCanal(v as 'email' | 'whatsapp')
                    setTemplateId('')
                  }}
                >
                  <SelectTrigger className="rounded-xl bg-white mt-1">
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
                        <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template */}
              <div>
                <Label className="text-xs font-semibold">Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="rounded-xl bg-white mt-1">
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
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-3.5 shadow-sm">
                  <p className="text-[11px] font-semibold text-neutral-500 mb-1">
                    Pré-visualização
                  </p>
                  {canal === 'email' && (
                    <p className="text-xs font-semibold text-neutral-900 mb-1">{preview.assunto}</p>
                  )}
                  <p className="text-xs text-neutral-600 line-clamp-3 whitespace-pre-wrap">
                    {preview.corpo}
                  </p>
                </div>
              )}

              {canal === 'whatsapp' && (
                <div className="rounded-2xl bg-amber-500/10 border border-[#F5C518]/40 p-3 text-xs text-neutral-800 space-y-1">
                  <p className="font-semibold text-neutral-900">Envio sequencial em aba única:</p>
                  <p className="text-neutral-700">
                    O WhatsApp Web abre em uma <strong>única aba reutilizada</strong>. Você clica em
                    "Abrir no WhatsApp", dá o Enter para enviar e clica em{' '}
                    <strong>"Próxima"</strong> no diálogo. Sem travar e sem bloqueio de popups.
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
                disabled={!canSend}
                className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {canal === 'whatsapp' ? 'Iniciar disparos' : 'Disparar'}
              </Button>
            </DialogFooter>
          </>
        ) : isDone ? (
          <>
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <h3 className="text-lg font-bold text-neutral-900">Disparos concluídos</h3>
                <p className="text-xs text-neutral-500">
                  Resumo do envio de WhatsApp para as {queue.totalLinks} cuidadoras selecionadas
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
                        Cuidadora atual
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
                    <strong>"Abrir no WhatsApp"</strong>, dê o <strong>Enter</strong> para enviar na
                    aba do WhatsApp Web e clique em <strong>"Próxima"</strong> para avançar para a
                    seguinte.
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
