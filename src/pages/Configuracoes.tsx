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
import { Settings } from 'lucide-react'
import { toast } from 'sonner'

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
