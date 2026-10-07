import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Star,
  Clock,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Send,
  Download,
  FileSpreadsheet,
  FileType,
} from 'lucide-react'
import { ImportCsvDialog } from '@/components/ImportCsvDialog'
import { ImportCurriculoDialog } from '@/components/ImportCurriculoDialog'
import { ComunicacaoPorTagDialog } from '@/components/ComunicacaoPorTagDialog'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getCuidadores,
  deleteCuidador,
  updateCuidador,
  parseTags,
  stringifyTags,
  hasTag,
  type Cuidador,
} from '@/services/cuidadores'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CuidadorFormDialog } from '@/components/cuidador-form-dialog'
import { TagEditor, TagBadges } from '@/components/TagEditor'
import { useFileUrl } from '@/hooks/use-file-url'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { exportCuidadoresExcel, exportCuidadoresPDF } from '@/lib/export-talentos'
import { cn } from '@/lib/utils'

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
  const [importOpen, setImportOpen] = useState(false)
  const [importCurriculoOpen, setImportCurriculoOpen] = useState(false)
  const [comunicacaoOpen, setComunicacaoOpen] = useState(false)

  // Filtros básicos (sempre visíveis)
  const [filterDisp, setFilterDisp] = useState('all')
  const [filterEsp, setFilterEsp] = useState('')
  const [filterLoc, setFilterLoc] = useState('')
  const [filterNome, setFilterNome] = useState('')
  const [sortOrder, setSortOrder] = useState<'nome' | '-nome' | 'created' | '-created'>('-created')

  // Filtros avançados (colapsáveis)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filterCidade, setFilterCidade] = useState('')
  const [filterBairro, setFilterBairro] = useState('')
  const [filterDispHorario, setFilterDispHorario] = useState('')
  const [filterCurso, setFilterCurso] = useState('')
  const [filterTurno, setFilterTurno] = useState('all')
  const [filterExpIlp, setFilterExpIlp] = useState('')
  const [filterInicioImediato, setFilterInicioImediato] = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [showInativas, setShowInativas] = useState(false)

  // Paginação / Carregar mais (blocos de 50)
  const PAGE_SIZE = 50
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Cuidadora pendente de exclusão lógica (AlertDialog)
  const [cuidadorToDelete, setCuidadorToDelete] = useState<Cuidador | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Tags já usadas (para o filtro por tag)
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    cuidadores.forEach((c) => parseTags(c.tags).forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [cuidadores])

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
  useRealtime('cuidadores', (e) => {
    const record = e.record as unknown as Cuidador
    if (e.action === 'create') setCuidadores((prev) => [record, ...prev])
    else if (e.action === 'update')
      setCuidadores((prev) => prev.map((c) => (c.id === record.id ? { ...record } : c)))
    else if (e.action === 'delete') setCuidadores((prev) => prev.filter((c) => c.id !== record.id))
  })

  const filtered = useMemo(() => {
    const contains = (field: string | undefined, query: string) =>
      !query || (field || '').toLowerCase().includes(query.toLowerCase())

    return cuidadores
      .filter((c) => {
        const isInactive = hasTag(c.tags, 'Inativa')
        if (!showInativas && isInactive) return false
        if (showInativas && filterTag === 'all' && !isInactive) {
          // Quando showInativas está marcado, exibe as inativas (ou todas se o usuário quiser)
          // mas se o filtro for especificamente "Mostrar inativas", ele inclui
        }

        if (!contains(c.nome, filterNome)) return false
        if (filterDisp !== 'all' && c.disponibilidade !== filterDisp) return false
        if (!contains(c.especialidades, filterEsp)) return false
        if (!contains(c.localizacao, filterLoc)) return false
        // Avançados
        if (!contains(c.cidade, filterCidade)) return false
        if (!contains(c.bairro, filterBairro)) return false
        if (!contains(c.disponibilidade_horario, filterDispHorario)) return false
        if (!contains(c.curso_cuidador, filterCurso)) return false
        if (filterTurno !== 'all' && c.turno !== filterTurno) return false
        if (!contains(c.experiencia_ilp, filterExpIlp)) return false
        if (!contains(c.inicio_imediato, filterInicioImediato)) return false
        if (filterTag !== 'all' && !hasTag(c.tags, filterTag)) return false
        return true
      })
      .sort((a, b) => {
        if (sortOrder === 'nome') return a.nome.localeCompare(b.nome)
        if (sortOrder === '-nome') return b.nome.localeCompare(a.nome)
        if (sortOrder === 'created')
          return new Date(a.created).getTime() - new Date(b.created).getTime()
        return new Date(b.created).getTime() - new Date(a.created).getTime() // '-created' default
      })
  }, [
    cuidadores,
    filterNome,
    filterDisp,
    filterEsp,
    filterLoc,
    filterCidade,
    filterBairro,
    filterDispHorario,
    filterCurso,
    filterTurno,
    filterExpIlp,
    filterInicioImediato,
    filterTag,
    showInativas,
    sortOrder,
  ])

  // Resetar a paginação ao mudar qualquer critério de busca/filtro/ordenação
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [
    filterNome,
    filterDisp,
    filterEsp,
    filterLoc,
    filterCidade,
    filterBairro,
    filterDispHorario,
    filterCurso,
    filterTurno,
    filterExpIlp,
    filterInicioImediato,
    filterTag,
    showInativas,
    sortOrder,
  ])

  const visibleCuidadores = useMemo(() => {
    return filtered.slice(0, visibleCount)
  }, [filtered, visibleCount])

  // Exclusão lógica: adiciona a tag "Inativa" sem duplicar
  const handleConfirmLogicalDelete = async () => {
    if (!cuidadorToDelete) return
    setDeleting(true)
    try {
      const currentTags = parseTags(cuidadorToDelete.tags)
      const hasInativa = currentTags.some((t) => t.toLowerCase() === 'inativa')
      const updatedTags = hasInativa
        ? stringifyTags(currentTags)
        : stringifyTags([...currentTags, 'Inativa'])

      await updateCuidador(cuidadorToDelete.id, { tags: updatedTags })
      setCuidadores((prev) =>
        prev.map((x) => (x.id === cuidadorToDelete.id ? { ...x, tags: updatedTags } : x)),
      )
      toast.success(`${cuidadorToDelete.nome} foi marcada como Inativa.`)
      setCuidadorToDelete(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  // Reativar cuidadora (remove a tag "Inativa")
  const handleReativar = async (c: Cuidador) => {
    try {
      const currentTags = parseTags(c.tags)
      const updatedTags = stringifyTags(currentTags.filter((t) => t.toLowerCase() !== 'inativa'))
      await updateCuidador(c.id, { tags: updatedTags })
      setCuidadores((prev) => prev.map((x) => (x.id === c.id ? { ...x, tags: updatedTags } : x)))
      toast.success(`${c.nome} foi reativada no Banco de Talentos.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleTagsChange = async (c: Cuidador, tags: string) => {
    try {
      await updateCuidador(c.id, { tags })
      setCuidadores((prev) => prev.map((x) => (x.id === c.id ? { ...x, tags } : x)))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const clearAdvanced = () => {
    setFilterCidade('')
    setFilterBairro('')
    setFilterDispHorario('')
    setFilterCurso('')
    setFilterTurno('all')
    setFilterExpIlp('')
    setFilterInicioImediato('')
    setFilterTag('all')
    setShowInativas(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Banco de Talentos</h1>
          <p className="text-sm text-muted-foreground">Cuidadores disponíveis para pré-seleção</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setComunicacaoOpen(true)}>
            <Send className="mr-2 h-4 w-4" /> Comunicação por Tag
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button variant="outline" onClick={() => setImportCurriculoOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Importar Currículo (PDF)
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Exportar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-3xl border-black/10 bg-[var(--background)] p-1 shadow-lg"
            >
              <DropdownMenuItem
                className="rounded-2xl px-3 py-2 focus:bg-amber-300/40"
                onSelect={() => {
                  try {
                    exportCuidadoresExcel(filtered)
                    toast.success(`Excel gerado com ${filtered.length} cuidador(a)`)
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-2xl px-3 py-2 focus:bg-amber-300/40"
                onSelect={() => {
                  try {
                    exportCuidadoresPDF(filtered)
                    toast.success(`PDF gerado com ${filtered.length} cuidador(a)`)
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                }}
              >
                <FileType className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Cuidador
          </Button>
        </div>{' '}
      </div>

      {/* Filtros básicos */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="w-56"
          placeholder="Buscar por nome..."
          value={filterNome}
          onChange={(e) => setFilterNome(e.target.value)}
        />
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
        <div className="w-48">
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created">Mais recentes</SelectItem>
              <SelectItem value="created">Mais antigos</SelectItem>
              <SelectItem value="nome">A-Z</SelectItem>
              <SelectItem value="-nome">Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => setAdvancedOpen((v) => !v)}>
          Filtros Avançados
          {advancedOpen ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>

        {/* Toggle / Filtro para exibir inativas */}
        <Button
          variant={showInativas ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowInativas((v) => !v)}
          className={cn(
            'rounded-full text-xs h-9 transition-colors',
            showInativas
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'text-neutral-700 hover:bg-neutral-100',
          )}
        >
          {showInativas ? 'Ocultar inativas' : 'Mostrar inativas'}
        </Button>
      </div>

      {/* Filtros avançados (colapsáveis) */}
      {advancedOpen && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Cidade</Label>
                <Input
                  placeholder="Cidade..."
                  value={filterCidade}
                  onChange={(e) => setFilterCidade(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bairro</Label>
                <Input
                  placeholder="Bairro..."
                  value={filterBairro}
                  onChange={(e) => setFilterBairro(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Disponibilidade de Horário</Label>
                <Input
                  placeholder="Disponibilidade de horário..."
                  value={filterDispHorario}
                  onChange={(e) => setFilterDispHorario(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Curso de Cuidador</Label>
                <Input
                  placeholder="Curso de cuidador..."
                  value={filterCurso}
                  onChange={(e) => setFilterCurso(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Turno</Label>
                <Select value={filterTurno} onValueChange={setFilterTurno}>
                  <SelectTrigger>
                    <SelectValue placeholder="Turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="12h">12h</SelectItem>
                    <SelectItem value="24h">24h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Experiência ILPI</Label>
                <Input
                  placeholder="Experiência ILPI..."
                  value={filterExpIlp}
                  onChange={(e) => setFilterExpIlp(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Início Imediato</Label>
                <Input
                  placeholder="Início imediato..."
                  value={filterInicioImediato}
                  onChange={(e) => setFilterInicioImediato(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tag</Label>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {availableTags.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearAdvanced}>
                Limpar filtros avançados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum cuidador encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Contador de exibição */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <p>
              Exibindo{' '}
              <span className="font-semibold text-neutral-900">{visibleCuidadores.length}</span> de{' '}
              <span className="font-semibold text-neutral-900">{filtered.length}</span> cuidadoras
              {showInativas && ' (incluindo inativas)'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCuidadores.map((c) => {
              const isInactive = hasTag(c.tags, 'Inativa')
              return (
                <Card
                  key={c.id}
                  className={cn(
                    'overflow-hidden hover:shadow-md transition-shadow',
                    isInactive && 'opacity-70 border-dashed border-neutral-300 bg-neutral-50/70',
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CuidadorPhoto cuidador={c} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium truncate">{c.nome}</p>
                          {isInactive && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-red-50 text-red-700 border-red-200 shrink-0"
                            >
                              Inativa
                            </Badge>
                          )}
                        </div>
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
                      {c.documentos_pdf &&
                        (Array.isArray(c.documentos_pdf)
                          ? c.documentos_pdf.length > 0
                          : Boolean(c.documentos_pdf)) && (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200"
                            title={`${Array.isArray(c.documentos_pdf) ? c.documentos_pdf.length : 1} PDF(s) anexado(s)`}
                          >
                            <FileText className="mr-1 h-3 w-3 text-red-500" />
                            {Array.isArray(c.documentos_pdf) ? c.documentos_pdf.length : 1} doc(s)
                          </Badge>
                        )}
                    </div>

                    {parseTags(c.tags).length > 0 && <TagBadges tags={c.tags} />}

                    <div className="flex justify-end gap-1">
                      <TagEditor tags={c.tags} onChange={(tags) => handleTagsChange(c, tags)} />
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
                      {isInactive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReativar(c)}
                          className="text-xs text-emerald-700 hover:text-emerald-800"
                          title="Reativar cuidadora"
                        >
                          Reativar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCuidadorToDelete(c)}
                          title="Excluir cuidadora"
                        >
                          <Trash2 className="h-4 w-4 text-neutral-500 hover:text-red-600" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Botão "Carregar mais" */}
          {visibleCount < filtered.length && (
            <div className="flex flex-col items-center justify-center gap-2 pt-4 pb-8">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="rounded-full px-8 py-2 font-medium bg-white hover:bg-neutral-50 shadow-sm border-neutral-300"
              >
                Carregar mais ({filtered.length - visibleCount} restantes)
              </Button>
              <p className="text-xs text-muted-foreground">
                Mostrando {visibleCount} de {filtered.length} cuidadoras
              </p>
            </div>
          )}
        </div>
      )}
      <CuidadorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cuidador={editing}
        onSaved={loadData}
      />
      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} onCompleted={loadData} />
      <ImportCurriculoDialog
        open={importCurriculoOpen}
        onOpenChange={setImportCurriculoOpen}
        onCompleted={loadData}
      />
      <ComunicacaoPorTagDialog open={comunicacaoOpen} onOpenChange={setComunicacaoOpen} />

      {/* AlertDialog de confirmação de exclusão (Lazuli design: #FAF9F5, rounded-3xl) */}
      <AlertDialog
        open={Boolean(cuidadorToDelete)}
        onOpenChange={(v) => {
          if (!v) setCuidadorToDelete(null)
        }}
      >
        <AlertDialogContent className="rounded-3xl bg-[#FAF9F5] border-neutral-200 p-6 sm:p-8 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-neutral-900">
              Excluir {cuidadorToDelete?.nome}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-neutral-600 leading-relaxed pt-1">
              Esta ação marcará a cuidadora com a tag <strong>"Inativa"</strong> e ela não aparecerá
              mais na listagem padrão do Banco de Talentos. Você poderá visualizá-la novamente a
              qualquer momento ativando o filtro "Mostrar inativas".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3 pt-4">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmLogicalDelete()
              }}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {deleting ? 'Excluindo...' : 'Sim, excluir cuidadora'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
