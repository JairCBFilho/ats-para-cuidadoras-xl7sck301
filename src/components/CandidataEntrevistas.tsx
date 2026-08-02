import { useState, useEffect } from 'react'
import {
  getEntrevistasByCandidata,
  deleteEntrevista,
  type Entrevista,
} from '@/services/entrevistas'
import { useRealtime } from '@/hooks/use-realtime'
import { EntrevistaFormDialog } from '@/components/EntrevistaFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { formatDateTime } from '@/lib/template-utils'
import { GoogleCalendarLink } from '@/components/GoogleCalendarLink'

const statusLabel: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
}
const statusColor: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-800 border-blue-200',
  realizada: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
}

export function CandidataEntrevistas({
  candidataId,
  candidataNome,
}: {
  candidataId: string
  candidataNome?: string
}) {
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Entrevista | null>(null)

  const load = async () => {
    try {
      setEntrevistas(await getEntrevistasByCandidata(candidataId))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [candidataId])
  useRealtime('entrevistas', () => {
    load()
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta entrevista?')) return
    try {
      await deleteEntrevista(id)
      toast.success('Entrevista excluída!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Entrevistas
        </h2>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Entrevista
        </Button>
      </div>
      {entrevistas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma entrevista agendada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entrevistas.map((ent) => (
            <Card key={ent.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{ent.expand?.vaga?.cargo || '—'}</span>
                    <Badge variant="outline" className={statusColor[ent.status]}>
                      {statusLabel[ent.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(ent.data_hora)}</p>
                  {ent.observacoes && <p className="text-sm">{ent.observacoes}</p>}
                  <div className="mt-2">
                    <GoogleCalendarLink
                      candidataNome={candidataNome || ''}
                      cargo={ent.expand?.vaga?.cargo || ''}
                      dataHora={ent.data_hora}
                      observacoes={ent.observacoes}
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(ent)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(ent.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <EntrevistaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={load}
        entrevista={editing}
        preselectCandidata={candidataId}
      />
    </div>
  )
}
