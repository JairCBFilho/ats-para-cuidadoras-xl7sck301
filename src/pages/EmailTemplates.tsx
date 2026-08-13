import { useState, useEffect } from 'react'
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  ETAPA_LABELS,
  type EmailTemplate,
  type EtapaEmail,
} from '@/services/email-templates'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

const STAGES: EtapaEmail[] = [
  'Triagem',
  'Entrevista',
  'Aprovada',
  'Rejeitada',
  'AtualizacaoCadastro',
  'VerificacaoDisponibilidade',
  'LembreteEntrevista',
]
const VARIABLES = ['{nome_candidata}', '{cargo}', '{etapa}', '{nome_vaga}', '{data_entrevista}']

interface TemplateForm {
  id?: string
  assunto: string
  corpo: string
  saving: boolean
  errors: FieldErrors
}

export default function EmailTemplates() {
  const [forms, setForms] = useState<Record<string, TemplateForm>>({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const templates = await getEmailTemplates()
      const newForms: Record<string, TemplateForm> = {}
      for (const stage of STAGES) {
        const t = templates.find((tpl) => tpl.etapa === stage)
        newForms[stage] = {
          id: t?.id,
          assunto: t?.assunto || '',
          corpo: t?.corpo || '',
          saving: false,
          errors: {},
        }
      }
      setForms(newForms)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('email_templates', () => {
    loadData()
  })

  const updateForm = (stage: string, field: keyof TemplateForm, value: string) => {
    setForms((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], [field]: value },
    }))
  }

  const handleSave = async (stage: EtapaEmail) => {
    const form = forms[stage]
    if (!form) return
    setForms((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], saving: true, errors: {} },
    }))
    try {
      if (form.id) {
        await updateEmailTemplate(form.id, {
          assunto: form.assunto,
          corpo: form.corpo,
        })
      } else {
        const created = await createEmailTemplate({
          etapa: stage,
          assunto: form.assunto,
          corpo: form.corpo,
        })
        setForms((prev) => ({
          ...prev,
          [stage]: { ...prev[stage], id: (created as EmailTemplate).id },
        }))
      }
      toast.success(`Template de ${ETAPA_LABELS[stage]} salvo!`)
    } catch (err) {
      const errors = extractFieldErrors(err)
      setForms((prev) => ({
        ...prev,
        [stage]: { ...prev[stage], errors },
      }))
      toast.error(getErrorMessage(err))
    } finally {
      setForms((prev) => ({
        ...prev,
        [stage]: { ...prev[stage], saving: false },
      }))
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" /> E-mails de Notificação
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize os e-mails enviados automaticamente em cada etapa do funil.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Variáveis disponíveis:</span>
        {VARIABLES.map((v) => (
          <Badge key={v} variant="secondary">
            {v}
          </Badge>
        ))}
      </div>
      <div className="grid gap-4">
        {STAGES.map((stage) => {
          const form = forms[stage]
          if (!form) return null
          return (
            <Card key={stage}>
              <CardHeader>
                <CardTitle>{ETAPA_LABELS[stage]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assunto</Label>
                  <Input
                    value={form.assunto}
                    onChange={(e) => updateForm(stage, 'assunto', e.target.value)}
                  />
                  {form.errors.assunto && (
                    <p className="mt-1 text-sm text-destructive">{form.errors.assunto}</p>
                  )}
                </div>
                <div>
                  <Label>Corpo (HTML)</Label>
                  <Textarea
                    value={form.corpo}
                    onChange={(e) => updateForm(stage, 'corpo', e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  {form.errors.corpo && (
                    <p className="mt-1 text-sm text-destructive">{form.errors.corpo}</p>
                  )}
                </div>
                <Button onClick={() => handleSave(stage)} disabled={form.saving}>
                  {form.saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
