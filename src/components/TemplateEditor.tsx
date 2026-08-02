import { useState, useEffect } from 'react'
import {
  type EmailTemplate,
  type EmailTemplateInput,
  createEmailTemplate,
  updateEmailTemplate,
} from '@/services/email-templates'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  etapa: string
  canal: 'email' | 'whatsapp'
  template: EmailTemplate | null
  onSaved: () => void
}

export function TemplateEditor({ etapa, canal, template, onSaved }: Props) {
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')
  const [anexoFile, setAnexoFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setAssunto(template?.assunto || '')
    setCorpo(template?.corpo || '')
    setAnexoFile(null)
    setErrors({})
  }, [template])

  const handleSave = async () => {
    const errs: FieldErrors = {}
    if (canal === 'email' && !assunto.trim()) errs.assunto = 'Assunto é obrigatório'
    if (!corpo.trim()) errs.corpo = 'Conteúdo é obrigatório'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const data: EmailTemplateInput = {
        etapa,
        canal,
        assunto: canal === 'email' ? assunto : etapa,
        corpo,
      }
      if (anexoFile) data.anexo = anexoFile
      if (template) await updateEmailTemplate(template.id, data)
      else await createEmailTemplate(data)
      toast.success(`Template de ${etapa} (${canal}) salvo!`)
      onSaved()
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      {canal === 'email' && (
        <div>
          <Label>Assunto</Label>
          <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          {errors.assunto && <p className="mt-1 text-sm text-destructive">{errors.assunto}</p>}
        </div>
      )}
      <div>
        <Label>{canal === 'email' ? 'Corpo (HTML)' : 'Mensagem'}</Label>
        <Textarea
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
        {errors.corpo && <p className="mt-1 text-sm text-destructive">{errors.corpo}</p>}
      </div>
      {canal === 'email' && (
        <div>
          <Label>Anexo (opcional)</Label>
          <Input type="file" onChange={(e) => setAnexoFile(e.target.files?.[0] || null)} />
          {template?.anexo && !anexoFile && (
            <p className="mt-1 text-xs text-muted-foreground">Anexo atual: {template.anexo}</p>
          )}
        </div>
      )}
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Save className="mr-2 h-3.5 w-3.5" />
        )}
        Salvar
      </Button>
    </div>
  )
}
