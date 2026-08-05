import { useState, useEffect, useCallback } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { useRealtime } from '@/hooks/use-realtime'
import { VagaFormDialog } from '@/components/vaga-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, MapPin, Clock, Users } from 'lucide-react'
import { VagaApplicationsDialog } from '@/components/VagaApplicationsDialog'
import { PreselecionarButton } from '@/components/PreselecionarButton'

export default function Vagas() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vaga | null>(null)
  const [appsVaga, setAppsVaga] = useState<Vaga | null>(null)

  const load = useCallback(async () => {
    try {
      setVagas(await getVagas())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('vagas', () => load())

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (vaga: Vaga) => {
    setEditing(vaga)
    setDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vagas</h1>
          <p className="text-muted-foreground">Gerencie as vagas para cuidadoras</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Vaga
        </Button>
      </div>
      {vagas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma vaga cadastrada. Clique em "Nova Vaga" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vagas.map((vaga) => (
            <Card key={vaga.id} className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{vaga.cargo}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(vaga)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {vaga.localizacao}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Turno: {vaga.turno}
                </p>
                {vaga.requisitos && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{vaga.requisitos}</p>
                )}
                <Badge variant={vaga.status === 'aberta' ? 'default' : 'secondary'}>
                  {vaga.status === 'aberta' ? 'Aberta' : 'Fechada'}
                </Badge>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAppsVaga(vaga)}
                  >
                    <Users className="mr-2 h-3.5 w-3.5" /> Ver candidatas
                  </Button>
                  <PreselecionarButton vagaId={vaga.id} onCompleted={load} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <VagaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vaga={editing}
        onSaved={load}
      />
      {appsVaga && (
        <VagaApplicationsDialog
          vaga={appsVaga}
          open={!!appsVaga}
          onOpenChange={(o) => !o && setAppsVaga(null)}
        />
      )}
    </div>
  )
}
