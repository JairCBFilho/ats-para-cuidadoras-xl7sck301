import { useState, useEffect } from 'react'
import {
  getEmailTemplates,
  ETAPA_LABELS,
  type EmailTemplate,
  type EtapaEmail,
} from '@/services/email-templates'
import {
  getConfiguracoes,
  updateConfiguracoes,
  createConfiguracoes,
  type Configuracoes,
} from '@/services/configuracoes'
import { useRealtime } from '@/hooks/use-realtime'
import { TemplateEditor } from '@/components/TemplateEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings, Link2, RefreshCw, Copy, Eye, EyeOff, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { regenerarTokenCadastro } from '@/services/cadastro-publico'
import pb from '@/lib/pocketbase/client'

const STAGES: EtapaEmail[] = [
  'Triagem',
  'Entrevista',
  'Aprovada',
  'Rejeitada',
  'AtualizacaoCadastro',
  'VerificacaoDisponibilidade',
]
const VARIABLES = ['{nome_candidata}', '{nome_vaga}', '{data_entrevista}']

export default function Configuracoes() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [loading, setLoading] = useState(true)
  const [showToken, setShowToken] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'recrutador'>('recrutador')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  const load = async () => {
    try {
      const [tpls, cfg] = await Promise.all([getEmailTemplates(), getConfiguracoes()])
      setTemplates(tpls)
      if (!cfg) {
        const created = await createConfiguracoes({ canal_manual: 'email' })
        setConfig(created)
      } else {
        setConfig(cfg)
      }
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('email_templates', () => load())

  const handleChannelChange = async (channel: 'email' | 'whatsapp') => {
    if (!config) return
    try {
      await updateConfiguracoes(config.id, { canal_manual: channel })
      setConfig({ ...config, canal_manual: channel })
      toast.success('Canal de envio manual atualizado!')
    } catch {
      toast.error('Erro ao atualizar configuração')
    }
  }

  const getTemplate = (etapa: string, canal: string) =>
    templates.find((t) => t.etapa === etapa && t.canal === canal) || null

  const token = config?.token_cadastro || ''
  const maskedToken = token
    ? token.length > 8
      ? token.slice(0, 4) + '...' + token.slice(-4)
      : token
    : ''

  const cadastroUrl = token ? `${window.location.origin}/cadastro?token=${token}` : ''

  const handleRegenerarToken = async () => {
    setRegenerating(true)
    try {
      const newToken = await regenerarTokenCadastro()
      // Atualiza o registro localmente (o hook já persistiu no backend)
      if (config) {
        setConfig({ ...config, token_cadastro: newToken })
      }
      toast.success('Novo token gerado com sucesso!')
    } catch {
      toast.error('Erro ao regenerar token')
    } finally {
      setRegenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!cadastroUrl) return
    try {
      await navigator.clipboard.writeText(cadastroUrl)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Informe o e-mail do convidado')
      return
    }
    setSendingInvite(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/convites/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Erro ao enviar convite')
      setInviteLink(data.link || '')
      toast.success('Convite enviado por e-mail!')
      setInviteEmail('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar convite')
    } finally {
      setSendingInvite(false)
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> Configurações
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canal de envio manual</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={config?.canal_manual}
            onValueChange={(v) => handleChannelChange(v as 'email' | 'whatsapp')}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Convites de acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Convites de acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O cadastro é fechado: novas contas só nascem por convite. Envie um convite por e-mail —
            o link vale 7 dias e permite criar uma única conta.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>E-mail do convidado</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="pessoa@email.com"
                className="w-64"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as 'admin' | 'recrutador')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recrutador">Recrutador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              onClick={handleSendInvite}
              disabled={sendingInvite}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <UserPlus className={`h-4 w-4 ${sendingInvite ? 'animate-pulse' : ''}`} />
              {sendingInvite ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
          {inviteLink && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Link do último convite</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs font-mono">
                  {inviteLink}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(inviteLink)
                      .then(() => toast.success('Link copiado!'))
                      .catch(() => toast.error('Não foi possível copiar'))
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted"
                  title="Copiar link do convite"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token de Cadastro Público */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Token de Cadastro Público
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Compartilhe o link abaixo com as candidatas para que elas preencham o formulário público
            de cadastro. O token garante que apenas pessoas com o link oficial consigam acessar.
          </p>

          <div className="space-y-2">
            <span className="text-sm font-medium">Token atual</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono">
                {showToken ? token || '—' : maskedToken || '—'}
              </code>
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted"
                title={showToken ? 'Ocultar token' : 'Mostrar token'}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {cadastroUrl && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Link completo</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs font-mono">
                  {cadastroUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted"
                  title="Copiar link completo"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">Link copiado para a área de transferência!</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleRegenerarToken}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              {token ? 'Regenerar token' : 'Gerar novo token'}
            </button>
          </div>

          {token && (
            <p className="text-xs text-muted-foreground">
              Atenção: ao regenerar o token, o link anterior deixará de funcionar.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-2">Modelos de comunicação</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Variáveis:</span>
          {VARIABLES.map((v) => (
            <Badge key={v} variant="secondary">
              {v}
            </Badge>
          ))}
        </div>
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="space-y-4">
            {STAGES.map((stage) => (
              <div key={stage}>
                <h3 className="mb-2 text-sm font-semibold">{ETAPA_LABELS[stage]}</h3>
                <TemplateEditor
                  etapa={stage}
                  canal="email"
                  template={getTemplate(stage, 'email')}
                  onSaved={load}
                />
              </div>
            ))}
          </TabsContent>
          <TabsContent value="whatsapp" className="space-y-4">
            {STAGES.map((stage) => (
              <div key={stage}>
                <h3 className="mb-2 text-sm font-semibold">{ETAPA_LABELS[stage]}</h3>
                <TemplateEditor
                  etapa={stage}
                  canal="whatsapp"
                  template={getTemplate(stage, 'whatsapp')}
                  onSaved={load}
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
