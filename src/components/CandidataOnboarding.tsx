import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getApplicationsByCandidata } from '@/services/applications'
import {
  getOnboarding,
  updateOnboarding,
  deleteOnboarding,
  type Onboarding,
  type StatusOnboarding,
} from '@/services/onboarding'
import { useRealtime } from '@/hooks/use-realtime'
import { OnboardingDialog } from '@/components/OnboardingDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const categoriaStyles: Record<string, string> = {
  Documentação: 'bg-blue-100 text-blue-800 border-blue-200',
  Treinamento: 'bg-purple-100 text-purple-800 border-purple-200',
  Contrato: 'bg-green-100 text-green-800 border-green-200',
  Outro: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function CandidataOnboarding({ candidataId }: { candidataId: string }) {
  const [tasks, setTasks] = useState<Onboarding[]>([])
  const [hasApprovedApp, setHasApprovedApp] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Onboarding | null>(null)

  const load = useCallback(async () => {
    try {
      const [taskData, apps] = await Promise.all([
        getOnboarding(candidataId),
        getApplicationsByCandidata(candidataId),
      ])
      setTasks(taskData)
      setHasApprovedApp(apps.some((a) => a.etapa === 'Aprovada'))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [candidataId])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('onboarding', () => load())
  useRealtime('applications', () => load())

  const toggleStatus = async (task: Onboarding) => {
    const newStatus: StatusOnboarding = task.status === 'pendente' ? 'concluida' : 'pendente'
    try {
      await updateOnboarding(task.id, { status: newStatus })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return
    try {
      await deleteOnboarding(taskId)
      toast.success('Tarefa excluída com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return null

  if (!hasApprovedApp) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Onboarding</h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Onboarding disponível após aprovação da candidata
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Onboarding</h2>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma tarefa de onboarding cadastrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Checkbox
                  checked={task.status === 'concluida'}
                  onCheckedChange={() => toggleStatus(task)}
                />
                <div className="flex-1 space-y-1">
                  <span
                    className={cn(
                      'font-medium',
                      task.status === 'concluida' && 'line-through text-muted-foreground',
                    )}
                  >
                    {task.tarefa}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={categoriaStyles[task.categoria]}>
                      {task.categoria}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(task)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <OnboardingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidataId={candidataId}
        onboarding={editing}
      />
    </div>
  )
}
