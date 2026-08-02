import { useState, useEffect, useCallback } from 'react'
import { getApplications, updateApplication, type Application } from '@/services/applications'
import { useRealtime } from '@/hooks/use-realtime'
import { ApplicationFormDialog } from '@/components/application-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STAGES = ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada'] as const
const STAGE_COLORS: Record<string, string> = {
  Triagem: 'border-t-amber-400',
  Entrevista: 'border-t-purple-400',
  Aprovada: 'border-t-green-500',
  Rejeitada: 'border-t-red-400',
}

export default function Funil() {
  const [apps, setApps] = useState<Application[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setApps(await getApplications())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('applications', () => load())
  useRealtime('vagas', () => load())
  useRealtime('candidatas', () => load())

  const moveApp = async (id: string, etapa: string) => {
    try {
      await updateApplication(id, { etapa })
      toast.success('Candidatura movida para ' + etapa)
      load()
    } catch {
      toast.error('Erro ao mover candidatura')
    }
  }

  const handleDrop = (e: React.DragEvent, etapa: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) moveApp(id, etapa)
  }

  const moveByIndex = (app: Application, dir: 'left' | 'right') => {
    const idx = STAGES.indexOf(app.etapa as (typeof STAGES)[number])
    const newIdx = dir === 'left' ? idx - 1 : idx + 1
    if (newIdx >= 0 && newIdx < STAGES.length) moveApp(app.id, STAGES[newIdx])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funil de Seleção</h1>
          <p className="text-muted-foreground">
            Arraste cards ou use as setas para mover candidatas
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Candidatura
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const items = apps.filter((a) => a.etapa === stage)
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage)}
              className="flex flex-col rounded-lg bg-muted/50 min-h-[400px]"
            >
              <div className={cn('border-t-4 rounded-t-lg px-4 py-3', STAGE_COLORS[stage])}>
                <h3 className="font-semibold text-sm">{stage}</h3>
                <p className="text-xs text-muted-foreground">{items.length} candidata(s)</p>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {items.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Vazio</p>
                ) : (
                  items.map((app) => (
                    <Card
                      key={app.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', app.id)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{app.expand?.candidata?.nome || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.expand?.vaga?.cargo || '—'}
                        </p>
                        <div className="flex justify-end gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveByIndex(app, 'left')}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveByIndex(app, 'right')}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
      <ApplicationFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
    </div>
  )
}
