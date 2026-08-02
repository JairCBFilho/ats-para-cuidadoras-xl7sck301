import { useState, useEffect, useCallback } from 'react'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import { useRealtime } from '@/hooks/use-realtime'
import { CandidataFormDialog } from '@/components/candidata-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, MapPin, GraduationCap } from 'lucide-react'

export default function Candidatas() {
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Candidata | null>(null)

  const load = useCallback(async () => {
    try {
      setCandidatas(await getCandidatas())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('candidatas', () => load())

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: Candidata) => {
    setEditing(c)
    setDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidatas</h1>
          <p className="text-muted-foreground">Gerencie as candidatas a cuidadoras</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Candidata
        </Button>
      </div>
      {candidatas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma candidata cadastrada. Clique em "Nova Candidata" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidatas.map((c) => (
            <Card key={c.id} className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.nome}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.formacao && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {c.formacao}
                  </p>
                )}
                {c.localizacao && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {c.localizacao}
                  </p>
                )}
                {c.experiencia && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.experiencia}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CandidataFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidata={editing}
        onSaved={load}
      />
    </div>
  )
}
