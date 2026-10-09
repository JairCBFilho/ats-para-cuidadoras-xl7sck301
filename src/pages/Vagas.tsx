import { useState, useEffect, useCallback } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { useRealtime } from '@/hooks/use-realtime'
import { VagaFormDialog } from '@/components/vaga-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Pencil,
  MapPin,
  Clock,
  Users,
  CheckSquare,
  Square,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { VagaApplicationsDialog } from '@/components/VagaApplicationsDialog'
import { PreselecionarButton } from '@/components/PreselecionarButton'
import { Checkbox } from '@/components/ui/checkbox'
import { deleteVaga, updateVaga } from '@/services/vagas'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

export default function Vagas() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vaga | null>(null)
  const [appsVaga, setAppsVaga] = useState<Vaga | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchOperating, setBatchOperating] = useState(false)

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === vagas.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(vagas.map((v) => v.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBatchStatus = async (status: 'aberta' | 'fechada') => {
    if (selectedIds.size === 0) return
    setBatchOperating(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map((id) => updateVaga(id, { status })))
      toast.success(
        `${ids.length} vaga(s) marcada(s) como ${status === 'aberta' ? 'aberta(s)' : 'fechada(s)'}!`,
      )
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBatchOperating(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (
      !confirm(
        `Deseja realmente excluir ${count} vaga(s) selecionada(s)? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }
    setBatchOperating(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map((id) => deleteVaga(id)))
      toast.success(`${count} vaga(s) excluída(s) com sucesso!`)
      setSelectedIds(new Set())
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBatchOperating(false)
    }
  }

  const isAllSelected = vagas.length > 0 && selectedIds.size === vagas.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vagas</h1>
          <p className="text-muted-foreground">Gerencie as vagas para cuidadoras</p>
        </div>
        <div className="flex items-center gap-2">
          {vagas.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="rounded-full text-xs h-9"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Desmarcar todas
                </>
              ) : (
                <>
                  <Square className="mr-1.5 h-3.5 w-3.5" /> Selecionar todas
                </>
              )}
            </Button>
          )}
          <Button onClick={openNew} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Nova Vaga
          </Button>
        </div>
      </div>

      {/* Barra de ação em lote com contador destacado quando houver seleção */}
      {vagas.length > 0 && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 transition-all',
            selectedIds.size > 0
              ? 'bg-amber-50/90 border-amber-300 shadow-sm'
              : 'bg-white/60 border-neutral-200/80 text-muted-foreground',
          )}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Selecionar todas as vagas"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900">
                {selectedIds.size === 0 ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    Selecione vagas pelos checkboxes para ações em lote
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Badge className="rounded-full bg-neutral-900 text-amber-300 hover:bg-neutral-900 px-3 py-0.5 text-xs font-bold">
                      {selectedIds.size}{' '}
                      {selectedIds.size === 1 ? 'vaga selecionada' : 'vagas selecionadas'}
                    </Badge>
                    <span className="text-xs text-neutral-600">de {vagas.length} vaga(s)</span>
                  </span>
                )}
              </span>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={batchOperating}
                onClick={() => handleBatchStatus('aberta')}
                className="rounded-full h-8 text-xs bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Marcar como Aberta
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={batchOperating}
                onClick={() => handleBatchStatus('fechada')}
                className="rounded-full h-8 text-xs bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5 text-neutral-500" />
                Marcar como Fechada
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={batchOperating}
                onClick={handleBatchDelete}
                className="rounded-full h-8 text-xs bg-white hover:bg-red-50 text-red-700 border-red-300"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                Excluir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={batchOperating}
                onClick={clearSelection}
                className="rounded-full h-8 text-xs text-neutral-600 hover:bg-neutral-200/60"
              >
                Limpar seleção
              </Button>
            </div>
          )}
        </div>
      )}

      {vagas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma vaga cadastrada. Clique em "Nova Vaga" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vagas.map((vaga) => {
            const isSelected = selectedIds.has(vaga.id)
            return (
              <Card
                key={vaga.id}
                className={cn(
                  'animate-fade-in-up transition-all',
                  isSelected &&
                    'ring-2 ring-neutral-900 border-neutral-900 bg-amber-50/30 shadow-md',
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(vaga.id)}
                        aria-label={`Selecionar vaga ${vaga.cargo}`}
                      />
                      <CardTitle className="text-base truncate">{vaga.cargo}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => openEdit(vaga)}
                      title="Editar vaga"
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
            )
          })}
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
