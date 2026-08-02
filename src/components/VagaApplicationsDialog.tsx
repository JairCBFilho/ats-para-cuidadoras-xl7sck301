import { useState, useEffect } from 'react'
import { getApplicationsByVaga, type Application } from '@/services/applications'
import { useRealtime } from '@/hooks/use-realtime'
import { BulkSendDialog } from '@/components/BulkSendDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Send } from 'lucide-react'
import type { Vaga } from '@/services/vagas'

interface Props {
  vaga: Vaga
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VagaApplicationsDialog({ vaga, open, onOpenChange }: Props) {
  const [apps, setApps] = useState<Application[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setApps(await getApplicationsByVaga(vaga.id))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setLoading(true)
      load()
      setSelected(new Set())
    }
  }, [open, vaga.id])
  useRealtime('applications', () => {
    if (open) load()
  })

  const toggle = (candidataId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(candidataId)) next.delete(candidataId)
      else next.add(candidataId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === apps.length) setSelected(new Set())
    else setSelected(new Set(apps.map((a) => a.candidata)))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Candidatas - {vaga.cargo}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : apps.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma candidatura para esta vaga.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selected.size === apps.length ? 'Desmarcar todas' : 'Selecionar todas'}
                </Button>
                <Button size="sm" disabled={selected.size === 0} onClick={() => setBulkOpen(true)}>
                  <Send className="mr-2 h-3.5 w-3.5" /> Enviar em lote ({selected.size})
                </Button>
              </div>
              {apps.map((app) => (
                <div key={app.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={selected.has(app.candidata)}
                    onCheckedChange={() => toggle(app.candidata)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{app.expand?.candidata?.nome || '—'}</p>
                    <p className="text-xs text-muted-foreground">{app.etapa}</p>
                  </div>
                  {app.compatibilidade !== undefined &&
                    app.compatibilidade !== null &&
                    app.compatibilidade > 0 && (
                      <Badge variant="secondary">{app.compatibilidade}%</Badge>
                    )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <BulkSendDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        candidataIds={Array.from(selected)}
        vagaId={vaga.id}
      />
    </>
  )
}
