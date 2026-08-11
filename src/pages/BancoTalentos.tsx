import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, MapPin, Star, Clock, Upload } from 'lucide-react'
import { ImportCsvDialog } from '@/components/ImportCsvDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { getCuidadores, deleteCuidador, type Cuidador } from '@/services/cuidadores'
import { CuidadorFormDialog } from '@/components/cuidador-form-dialog'
import { useFileUrl } from '@/hooks/use-file-url'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

function CuidadorPhoto({ cuidador }: { cuidador: Cuidador }) {
  const photoUrl = useFileUrl(cuidador, cuidador.foto)
  return (
    <Avatar className="h-12 w-12">
      {photoUrl && <AvatarImage src={photoUrl} alt={cuidador.nome} />}
      <AvatarFallback>{cuidador.nome?.[0]?.toUpperCase() || '?'}</AvatarFallback>
    </Avatar>
  )
}

export default function BancoTalentos() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cuidador | null>(null)
  const [filterDisp, setFilterDisp] = useState('all')
  const [filterEsp, setFilterEsp] = useState('')
  const [filterLoc, setFilterLoc] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const loadData = async () => {
    try {
      setCuidadores(await getCuidadores())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('cuidadores', () => loadData())

  const filtered = useMemo(() => {
    return cuidadores.filter((c) => {
      if (filterDisp !== 'all' && c.disponibilidade !== filterDisp) return false
      if (filterEsp && !c.especialidades?.toLowerCase().includes(filterEsp.toLowerCase()))
        return false
      if (filterLoc && !c.localizacao?.toLowerCase().includes(filterLoc.toLowerCase())) return false
      return true
    })
  }, [cuidadores, filterDisp, filterEsp, filterLoc])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cuidador?')) return
    try {
      await deleteCuidador(id)
      toast.success('Cuidador excluído com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Banco de Talentos</h1>
          <p className="text-sm text-muted-foreground">Cuidadores disponíveis para pré-seleção</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Cuidador
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select value={filterDisp} onValueChange={setFilterDisp}>
            <SelectTrigger>
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="disponível">Disponível</SelectItem>
              <SelectItem value="indisponível">Indisponível</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          className="w-48"
          placeholder="Especialidade..."
          value={filterEsp}
          onChange={(e) => setFilterEsp(e.target.value)}
        />
        <Input
          className="w-48"
          placeholder="Localização..."
          value={filterLoc}
          onChange={(e) => setFilterLoc(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum cuidador encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CuidadorPhoto cuidador={c} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{c.email}</p>
                    {c.localizacao && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {c.localizacao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={c.disponibilidade === 'disponível' ? 'default' : 'secondary'}>
                    {c.disponibilidade || '—'}
                  </Badge>
                  {c.turno && (
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {c.turno}
                    </Badge>
                  )}
                  {c.especialidades && (
                    <Badge variant="outline">
                      <Star className="mr-1 h-3 w-3" />
                      {c.especialidades}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(c)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CuidadorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cuidador={editing}
        onSaved={loadData}
      />
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} onCompleted={loadData} />
    </div>
  )
}
