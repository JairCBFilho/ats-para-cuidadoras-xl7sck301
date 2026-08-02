import { useState, useEffect, useCallback } from 'react'
import { getEntrevistas, deleteEntrevista, type Entrevista } from '@/services/entrevistas'
import { useRealtime } from '@/hooks/use-realtime'
import { EntrevistaFormDialog } from '@/components/EntrevistaFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react'
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

export default function Entrevistas() {
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Entrevista | null>(null)

  const load = useCallback(async () => {
    try {
      setEntrevistas(await getEntrevistas())
    } catch {
      /* ignore */
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])
  useRealtime('entrevistas', () => {
    load()
  })
  useRealtime('candidatas', () => {
    load()
  })
  useRealtime('vagas', () => {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" /> Entrevistas
          </h1>
          <p className="text-muted-foreground">Gerencie as entrevistas agendadas</p>
        </div>
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
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma entrevista cadastrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entrevistas.map((ent) => (
            <Card key={ent.id} className="animate-fade-in-up">
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ent.expand?.candidata?.nome || '—'}</span>
                    <Badge variant="outline" className={statusColor[ent.status]}>
                      {statusLabel[ent.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ent.expand?.vaga?.cargo || '—'}</p>
                  <p className="text-sm font-medium">{formatDateTime(ent.data_hora)}</p>
                  {ent.observacoes && (
                    <p className="text-sm text-muted-foreground">{ent.observacoes}</p>
                  )}
                  <div className="mt-2">
                    <GoogleCalendarLink
                      candidataNome={ent.expand?.candidata?.nome || ''}
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
                    className="h-8 w-8"
                    onClick={() => {
                      setEditing(ent)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(ent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
      />
    </div>
  )
}
