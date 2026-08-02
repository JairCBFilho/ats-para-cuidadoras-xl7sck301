import { useState, useEffect, useMemo } from 'react'
import { getCandidata, type Candidata } from '@/services/candidatas'
import { getApplicationsByCandidata, type Application } from '@/services/applications'
import { getEmailTemplates, type EmailTemplate } from '@/services/email-templates'
import { getEntrevistasByCandidata, type Entrevista } from '@/services/entrevistas'
import { getConfiguracoes } from '@/services/configuracoes'
import { sendManualEmail } from '@/services/manual-send'
import { replaceTemplateVariables, formatDateTime, type TemplateVars } from '@/lib/template-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidataId: string
}

export function ManualCommunicationDialog({ open, onOpenChange, candidataId }: Props) {
  const [candidata, setCandidata] = useState<Candidata | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    getCandidata(candidataId)
      .then(setCandidata)
      .catch(() => {})
    getApplicationsByCandidata(candidataId)
      .then((a) => {
        setApps(a)
        if (a.length > 0) setSelectedAppId(a[0].id)
      })
      .catch(() => {})
    getEmailTemplates()
      .then(setTemplates)
      .catch(() => {})
    getEntrevistasByCandidata(candidataId)
      .then(setEntrevistas)
      .catch(() => {})
    getConfiguracoes()
      .then((c) => {
        if (c) setChannel(c.canal_manual)
      })
      .catch(() => {})
  }, [open, candidataId])

  const selectedApp = apps.find((a) => a.id === selectedAppId)
  const etapa = selectedApp?.etapa || 'Triagem'

  const vars: TemplateVars = useMemo(() => {
    const cargo = selectedApp?.expand?.vaga?.cargo || ''
    const ent = entrevistas.find((e) => e.vaga === selectedApp?.vaga)
    return {
      nome_candidata: candidata?.nome || '',
      cargo,
      etapa,
      nome_vaga: cargo,
      data_entrevista: ent ? formatDateTime(ent.data_hora) : 'data a confirmar',
    }
  }, [candidata, selectedApp, entrevistas, etapa])

  useEffect(() => {
    const tpl = templates.find((t) => t.etapa === etapa && t.canal === channel)
    if (tpl) {
      setSubject(replaceTemplateVariables(tpl.assunto, vars))
      setBody(replaceTemplateVariables(tpl.corpo, vars))
    } else {
      setSubject('')
      setBody('')
    }
  }, [etapa, channel, templates, vars])

  const handleSendEmail = async () => {
    if (!candidata?.email) {
      toast.error('Candidata não possui e-mail')
      return
    }
    setSending(true)
    try {
      await sendManualEmail({ to: candidata.email, toName: candidata.nome, subject, html: body })
      toast.success('E-mail enviado com sucesso!')
      onOpenChange(false)
    } catch {
      toast.error('Erro ao enviar e-mail')
    } finally {
      setSending(false)
    }
  }

  const whatsappLink = useMemo(() => {
    if (!candidata?.telefone) return ''
    const phone = candidata.telefone.replace(/[^\d]/g, '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`
  }, [candidata, body])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Comunicação</DialogTitle>
        </DialogHeader>
        {candidata && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>{candidata.nome}</strong>
              </p>
              <p>
                {candidata.email || 'Sem e-mail'} | {candidata.telefone || 'Sem telefone'}
              </p>
            </div>
            {apps.length > 0 && (
              <div>
                <Label>Vaga</Label>
                <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.expand?.vaga?.cargo || '—'} ({a.etapa})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as 'email' | 'whatsapp')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="whatsapp">Link do WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {channel === 'email' && (
              <div>
                <Label>Assunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            )}
            <div>
              <Label>{channel === 'email' ? 'Corpo (HTML)' : 'Mensagem'}</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          {channel === 'email' ? (
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar e-mail
            </Button>
          ) : (
            <Button asChild disabled={!whatsappLink}>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Abrir WhatsApp
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
