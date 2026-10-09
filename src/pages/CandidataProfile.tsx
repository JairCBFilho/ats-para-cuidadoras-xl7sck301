import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Mail,
  MapPin,
  BookOpen,
  MessageCircle,
  FileText,
  Linkedin,
  ExternalLink,
  Send,
  Database,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { getCandidata, type Candidata } from '@/services/candidatas'
import { getCuidadores, type Cuidador } from '@/services/cuidadores'
import {
  getReferencias,
  deleteReferencia,
  type Referencia,
  type StatusReferencia,
} from '@/services/referencias'
import { useFileUrl } from '@/hooks/use-file-url'
import { ReferenciaDialog } from '@/components/ReferenciaDialog'
import { CandidataOnboarding } from '@/components/CandidataOnboarding'
import { CompatibilidadeSection } from '@/components/CompatibilidadeSection'
import { CandidataEntrevistas } from '@/components/CandidataEntrevistas'
import { ManualCommunicationDialog } from '@/components/ManualCommunicationDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const statusStyles: Record<StatusReferencia, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmada: 'bg-green-100 text-green-800 border-green-200',
  rejeitada: 'bg-red-100 text-red-800 border-red-200',
}
const statusLabel: Record<StatusReferencia, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  rejeitada: 'Rejeitada',
}

export default function CandidataProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [candidata, setCandidata] = useState<Candidata | null>(null)
  const [referencias, setReferencias] = useState<Referencia[]>([])
  const [cuidadorCorrespondente, setCuidadorCorrespondente] = useState<Cuidador | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRef, setEditingRef] = useState<Referencia | null>(null)
  const [commOpen, setCommOpen] = useState(false)
  const curriculoUrl = useFileUrl(candidata?.curriculo ? candidata : null, candidata?.curriculo)

  const loadData = async () => {
    if (!id) return
    try {
      const [c, refs, cuidadores] = await Promise.all([
        getCandidata(id),
        getReferencias(id),
        getCuidadores().catch(() => [] as Cuidador[]),
      ])
      setCandidata(c)
      setReferencias(refs)
      if (c && c.email) {
        const clean = c.email.trim().toLowerCase()
        const found = cuidadores.find((item) => (item.email || '').trim().toLowerCase() === clean)
        setCuidadorCorrespondente(found || null)
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('candidatas', () => {
    loadData()
  })
  useRealtime('cuidadores', () => {
    loadData()
  })
  useRealtime('applications', () => {
    loadData()
  })

  const handleDelete = async (refId: string) => {
    if (!confirm('Deseja excluir esta referência?')) return
    try {
      await deleteReferencia(refId)
      toast.success('Referência excluída!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>
  if (!candidata) return <div className="p-6 text-muted-foreground">Candidata não encontrada.</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/candidatas">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {cuidadorCorrespondente ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/banco-talentos?email=${encodeURIComponent(candidata.email)}&editar=true`)
              }
              className="rounded-full bg-amber-50 hover:bg-amber-100 text-neutral-900 border-amber-300 font-medium"
            >
              <Database className="mr-2 h-4 w-4 text-amber-700" />
              Ver cadastro no Banco de Talentos
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="rounded-full opacity-60 text-xs"
              title="Não foi localizado cadastro correspondente por e-mail no Banco de Talentos"
            >
              <Database className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              Sem cadastro no Banco de Talentos
            </Button>
          )}
          <Button onClick={() => setCommOpen(true)} className="rounded-full">
            <Send className="mr-2 h-4 w-4" /> Enviar comunicação
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{candidata.nome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" /> {candidata.email}
          </div>
          {candidata.telefone && (
            <a
              href={`https://wa.me/${candidata.telefone.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            </a>
          )}
          {candidata.formacao && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" /> {candidata.formacao}
            </div>
          )}
          {candidata.localizacao && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" /> {candidata.localizacao}
            </div>
          )}
          {candidata.experiencia && (
            <p className="text-sm text-muted-foreground pt-2 border-t mt-2">
              {candidata.experiencia}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2 border-t mt-2">
            {curriculoUrl ? (
              <a href={curriculoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" /> Currículo
                </Button>
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">Currículo não informado</p>
            )}
            {candidata.linkedin && (
              <a href={candidata.linkedin} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                </Button>
              </a>
            )}
            {candidata.portfolio && (
              <a href={candidata.portfolio} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" /> Portfólio
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <CompatibilidadeSection candidataId={id!} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Referências</h2>
        <Button
          onClick={() => {
            setEditingRef(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Referência
        </Button>
      </div>
      <div className="grid gap-4">
        {referencias.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma referência cadastrada.
            </CardContent>
          </Card>
        ) : (
          referencias.map((ref) => (
            <Card key={ref.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{ref.nome}</span>
                    <Badge variant="outline" className={statusStyles[ref.status]}>
                      {statusLabel[ref.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Contato: {ref.contato}</p>
                  {ref.relacionamento && (
                    <p className="text-sm">Relacionamento: {ref.relacionamento}</p>
                  )}
                  {ref.observacoes && (
                    <p className="text-sm text-muted-foreground pt-1">{ref.observacoes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingRef(ref)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ref.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <ReferenciaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidataId={id!}
        referencia={editingRef}
      />
      <CandidataEntrevistas candidataId={id!} candidataNome={candidata.nome} />
      <CandidataOnboarding candidataId={id!} />
      <ManualCommunicationDialog open={commOpen} onOpenChange={setCommOpen} candidataId={id!} />
    </div>
  )
}
