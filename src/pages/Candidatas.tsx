import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, User, SlidersHorizontal, Database } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { getCandidatas, deleteCandidata, type Candidata } from '@/services/candidatas'
import { getVagas, type Vaga } from '@/services/vagas'
import { getApplicationsByVaga } from '@/services/applications'
import { getCuidadores, type Cuidador } from '@/services/cuidadores'
import { CandidataFormDialog } from '@/components/candidata-form-dialog'
import { CandidataPhoto } from '@/components/candidata-photo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Candidatas() {
  const navigate = useNavigate()
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [cuidadoresMap, setCuidadoresMap] = useState<Record<string, Cuidador>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Candidata | null>(null)
  const [selectedVaga, setSelectedVaga] = useState('')
  const [sortByMatch, setSortByMatch] = useState(false)
  const [compatMap, setCompatMap] = useState<Record<string, number | undefined>>({})

  const loadData = async () => {
    try {
      const [data, v, cuidadores] = await Promise.all([
        getCandidatas(),
        getVagas(),
        getCuidadores().catch(() => [] as Cuidador[]),
      ])
      setCandidatas(data)
      setVagas(v)
      const map: Record<string, Cuidador> = {}
      cuidadores.forEach((cuidador) => {
        if (cuidador.email) {
          map[cuidador.email.trim().toLowerCase()] = cuidador
        }
      })
      setCuidadoresMap(map)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const loadCompat = async () => {
    if (!selectedVaga) {
      setCompatMap({})
      return
    }
    try {
      const apps = await getApplicationsByVaga(selectedVaga)
      const map: Record<string, number | undefined> = {}
      apps.forEach((a) => {
        map[a.candidata] = a.compatibilidade
      })
      setCompatMap(map)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useEffect(() => {
    loadCompat()
  }, [selectedVaga])
  useRealtime('candidatas', () => loadData())
  useRealtime('cuidadores', () => loadData())
  useRealtime('applications', () => {
    if (selectedVaga) loadCompat()
  })

  const sorted = useMemo(() => {
    if (sortByMatch && selectedVaga) {
      return [...candidatas].sort((a, b) => (compatMap[b.id] ?? -1) - (compatMap[a.id] ?? -1))
    }
    return candidatas
  }, [candidatas, sortByMatch, selectedVaga, compatMap])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta candidata?')) return
    try {
      await deleteCandidata(id)
      toast.success('Candidata excluída com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Candidatas</h1>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Candidata
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="w-64">
          <Select value={selectedVaga || undefined} onValueChange={setSelectedVaga}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por vaga" />
            </SelectTrigger>
            <SelectContent>
              {vagas.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedVaga && (
          <Button
            variant={sortByMatch ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortByMatch(!sortByMatch)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Melhor match
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma candidata cadastrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((c) => {
            const score = compatMap[c.id]
            const cleanEmail = (c.email || '').trim().toLowerCase()
            const cuidador = cleanEmail ? cuidadoresMap[cleanEmail] : undefined
            return (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div
                    onClick={() => {
                      if (cuidador) {
                        navigate(`/banco-talentos?email=${encodeURIComponent(c.email)}&editar=true`)
                      } else {
                        navigate(`/candidatas/${c.id}`)
                      }
                    }}
                    className="flex items-start gap-3 cursor-pointer group"
                    title={
                      cuidador
                        ? 'Clique para ver cadastro no Banco de Talentos'
                        : 'Clique para ver perfil da candidata'
                    }
                  >
                    <CandidataPhoto
                      candidata={c}
                      className="h-12 w-12 group-hover:ring-2 group-hover:ring-amber-400 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-amber-700 transition-colors">
                        {c.nome}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{c.email}</p>
                      {c.localizacao && (
                        <p className="text-xs text-muted-foreground truncate">{c.localizacao}</p>
                      )}
                    </div>
                  </div>
                  {selectedVaga && (
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-xs text-muted-foreground">
                        Grau de compatibilidade:
                      </span>
                      {score !== undefined ? (
                        <Badge variant={score >= 70 ? 'default' : 'secondary'}>{score}%</Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-2">
                    {/* Botão/Link direto para o cadastro no Banco de Talentos */}
                    {cuidador ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/banco-talentos?email=${encodeURIComponent(c.email)}&editar=true`,
                          )
                        }
                        className="rounded-full h-7 px-2.5 text-[11px] bg-amber-50 hover:bg-amber-100 text-neutral-900 border-amber-300 gap-1 font-medium shadow-none"
                        title="Ver e editar cadastro correspondente no Banco de Talentos"
                      >
                        <Database className="h-3 w-3 text-amber-700" />
                        Ver no Banco
                      </Button>
                    ) : (
                      <span
                        className="text-[11px] text-muted-foreground italic"
                        title="Esta candidata ainda não possui cadastro no Banco de Talentos"
                      >
                        Sem cadastro no Banco
                      </span>
                    )}

                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="Ver perfil detalhado">
                        <Link to={`/candidatas/${c.id}`}>
                          <User className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(c)
                          setDialogOpen(true)
                        }}
                        title="Editar candidata"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        title="Excluir candidata"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CandidataFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidata={editing}
        onSaved={loadData}
      />
    </div>
  )
}
