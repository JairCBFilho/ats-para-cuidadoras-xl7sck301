import { useState, useEffect, useMemo, useCallback } from 'react'
import { getApplications, type Application } from '@/services/applications'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import { getCuidadores, type Cuidador } from '@/services/cuidadores'
import { getVagas, type Vaga } from '@/services/vagas'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  TrendingUp,
  Clock,
  Users,
  Target,
  Database,
  MapPin,
  Briefcase,
  BarChart3,
} from 'lucide-react'

const STAGES = ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada'] as const

type Periodo = '7' | '30' | '90' | 'all'

// Retorna o timestamp (ms) de início do período selecionado, ou null para "Todos".
function periodoStart(periodo: Periodo): number | null {
  if (periodo === 'all') return null
  const dias = Number(periodo)
  return Date.now() - dias * 24 * 60 * 60 * 1000
}

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([])
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [vagaSelecionada, setVagaSelecionada] = useState<string>('all')
  const [periodo, setPeriodo] = useState<Periodo>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [a, c, cuid, v] = await Promise.all([
        getApplications(),
        getCandidatas(),
        getCuidadores(),
        getVagas(),
      ])
      setApps(a)
      setCandidatas(c)
      setCuidadores(cuid)
      setVagas(v)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('applications', () => load())
  useRealtime('candidatas', () => load())
  useRealtime('cuidadores', () => load())
  useRealtime('vagas', () => load())

  // Aplica o filtro de vaga quando uma vaga específica está selecionada.
  // Os talentos (cuidadores) não são filtrados por vaga diretamente — eles são
  // filtrados indiretamente pelas candidaturas vinculadas (conversão).
  const vagaFiltrada = vagaSelecionada !== 'all'
  const periodoIni = useMemo(() => periodoStart(periodo), [periodo])

  // Aplica o filtro de período (por `created`) combinado com o filtro de vaga.
  const appsFiltradas = useMemo(() => {
    const ini = periodoIni
    return apps.filter((a) => {
      if (vagaFiltrada && a.vaga !== vagaSelecionada) return false
      if (ini !== null && new Date(a.created).getTime() < ini) return false
      return true
    })
  }, [apps, vagaFiltrada, vagaSelecionada, periodoIni])

  // Candidatas do período (por `created`). Usado para "Talentos novos no banco"
  // e para origens/fontes quando nenhuma vaga está selecionada.
  const candidatasPeriodo = useMemo(() => {
    const ini = periodoIni
    if (ini === null) return candidatas
    return candidatas.filter((c) => new Date(c.created).getTime() >= ini)
  }, [candidatas, periodoIni])

  // Quando uma vaga específica está selecionada, restringimos as candidatas
  // consideradas às que possuem candidatura naquela vaga (no período). Isso
  // filtra as fontes.
  const candidatasDaVaga = useMemo(() => {
    if (!vagaFiltrada) return candidatasPeriodo
    const ids = new Set(appsFiltradas.map((a) => a.candidata))
    return candidatasPeriodo.filter((c) => ids.has(c.id))
  }, [candidatasPeriodo, appsFiltradas, vagaFiltrada])

  // Métricas existentes (applications + candidatas)
  const total = appsFiltradas.length
  const stageData = STAGES.map((stage) => ({
    stage,
    count: appsFiltradas.filter((a) => a.etapa === stage).length,
  }))
  const approvedCount = stageData.find((s) => s.stage === 'Aprovada')?.count || 0
  const approvalRate = total > 0 ? (approvedCount / total) * 100 : 0
  const avgTime =
    total > 0
      ? appsFiltradas.reduce((sum, a) => {
          const end =
            a.etapa === 'Aprovada' || a.etapa === 'Rejeitada'
              ? new Date(a.updated).getTime()
              : Date.now()
          return sum + (end - new Date(a.created).getTime()) / (1000 * 60 * 60 * 24)
        }, 0) / total
      : 0

  const sourceStats: Record<string, number> = {}
  appsFiltradas.forEach((app) => {
    const c = candidatasDaVaga.find((cnd) => cnd.id === app.candidata)
    const origem = c?.origem || 'Não informado'
    sourceStats[origem] = (sourceStats[origem] || 0) + 1
  })
  const maxSource = Math.max(...Object.values(sourceStats), 1)

  // Novas métricas (cuidadores)
  // Cuidadores do período (por `created`) — "Talentos novos no banco".
  const cuidadoresPeriodo = useMemo(() => {
    const ini = periodoIni
    if (ini === null) return cuidadores
    return cuidadores.filter((c) => new Date(c.created).getTime() >= ini)
  }, [cuidadores, periodoIni])

  // Talentos: quando uma vaga está selecionada, mostramos os talentos do período
  // que têm candidatura naquela vaga (via candidata vinculada por email/cpf).
  const totalTalentos = useMemo(() => {
    if (!vagaFiltrada) return cuidadoresPeriodo.length
    const candIdsDaVaga = new Set(appsFiltradas.map((a) => a.candidata))
    const candEmails = new Set(
      candidatasPeriodo
        .filter((c) => candIdsDaVaga.has(c.id))
        .map((c) => (c.email || '').toLowerCase()),
    )
    return cuidadoresPeriodo.filter((c) => candEmails.has((c.email || '').toLowerCase())).length
  }, [cuidadoresPeriodo, candidatasPeriodo, appsFiltradas, vagaFiltrada])

  const talentosDisponiveis = useMemo(() => {
    if (!vagaFiltrada)
      return cuidadoresPeriodo.filter((c) => c.disponibilidade === 'disponível').length
    const candIdsDaVaga = new Set(appsFiltradas.map((a) => a.candidata))
    const candEmails = new Set(
      candidatasPeriodo
        .filter((c) => candIdsDaVaga.has(c.id))
        .map((c) => (c.email || '').toLowerCase()),
    )
    return cuidadoresPeriodo.filter(
      (c) => candEmails.has((c.email || '').toLowerCase()) && c.disponibilidade === 'disponível',
    ).length
  }, [cuidadoresPeriodo, candidatasPeriodo, appsFiltradas, vagaFiltrada])

  // Top 5 cidades — agrupamento case-insensitive, com nome normalizado para exibição.
  // Primeira letra de cada palavra em maiúscula (ex: "rio de janeiro" -> "Rio de Janeiro").
  const normalizeCidade = (raw: string): string => {
    const trimmed = raw.trim().toLowerCase()
    if (!trimmed) return ''
    // Mantém conectivos comuns em minúsculas (de, da, do, das, dos, e).
    const pequenas = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
    return trimmed
      .split(/\s+/)
      .map((palavra, i) =>
        i > 0 && pequenas.has(palavra)
          ? palavra
          : palavra.charAt(0).toUpperCase() + palavra.slice(1),
      )
      .join(' ')
  }

  // Quando uma vaga está selecionada, consideramos apenas as cuidadoras
  // vinculadas às candidatas daquela vaga para as métricas de cidades e turnos.
  // Sempre respeitamos o filtro de período (por `created` dos cuidadores).
  const cuidadoresParaAgregados = useMemo(() => {
    if (!vagaFiltrada) return cuidadoresPeriodo
    const candIdsDaVaga = new Set(appsFiltradas.map((a) => a.candidata))
    const candEmails = new Set(
      candidatasPeriodo
        .filter((c) => candIdsDaVaga.has(c.id))
        .map((c) => (c.email || '').toLowerCase()),
    )
    return cuidadoresPeriodo.filter((c) => candEmails.has((c.email || '').toLowerCase()))
  }, [cuidadoresPeriodo, candidatasPeriodo, appsFiltradas, vagaFiltrada])

  // Conta por chave lowercase; guarda o nome normalizado para exibição.
  const cidadesCount: Record<string, number> = {}
  const cidadesNome: Record<string, string> = {}
  cuidadoresParaAgregados.forEach((c) => {
    const chave = (c.cidade || '').trim().toLowerCase()
    if (!chave) return
    cidadesCount[chave] = (cidadesCount[chave] || 0) + 1
    if (!cidadesNome[chave]) cidadesNome[chave] = normalizeCidade(c.cidade || '')
  })
  const topCidades = Object.entries(cidadesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([chave, count]) => [cidadesNome[chave], count] as [string, number])
  const maxCidade = Math.max(...topCidades.map(([, n]) => n), 1)

  // Taxa de conversão: % de cuidadores do período com pelo menos uma candidatura
  // no período (cuidador cujo email ou cpf também existe em uma candidata que
  // tem application dentro do período/vaga selecionados).
  const conversao = useMemo(() => {
    const baseCuidadores = vagaFiltrada ? cuidadoresParaAgregados : cuidadoresPeriodo
    if (baseCuidadores.length === 0) return 0
    // Mapa de candidatas por email e por cpf (lowercase), e ids de candidatas com application
    const candByEmail = new Map<string, string>() // email -> candidata.id
    const candByCpf = new Map<string, string>() // cpf -> candidata.id
    candidatasPeriodo.forEach((c) => {
      const email = (c.email || '').toLowerCase()
      if (email) candByEmail.set(email, c.id)
    })
    // candidatas também podem possuir cpf (importação CSV); o tipo Candidata não expõe,
    // mas o registro PocketBase pode conter — usamos acesso seguro.
    candidatasPeriodo.forEach((c) => {
      const cpf = String((c as unknown as Record<string, unknown>).cpf || '').toLowerCase()
      if (cpf) candByCpf.set(cpf, c.id)
    })
    const appsCandIds = new Set(appsFiltradas.map((a) => a.candidata))

    let comApp = 0
    baseCuidadores.forEach((cuid) => {
      const email = (cuid.email || '').toLowerCase()
      const cpf = (cuid.cpf || '').toLowerCase()
      const candIdByEmail = email ? candByEmail.get(email) : undefined
      const candIdByCpf = cpf ? candByCpf.get(cpf) : undefined
      if (
        (candIdByEmail && appsCandIds.has(candIdByEmail)) ||
        (candIdByCpf && appsCandIds.has(candIdByCpf))
      ) {
        comApp++
      }
    })
    return (comApp / baseCuidadores.length) * 100
  }, [cuidadoresPeriodo, cuidadoresParaAgregados, candidatasPeriodo, appsFiltradas, vagaFiltrada])

  // Distribuição por turno
  const turno12 = cuidadoresParaAgregados.filter((c) => c.turno === '12h').length
  const turno24 = cuidadoresParaAgregados.filter((c) => c.turno === '24h').length
  const totalTurno = turno12 + turno24

  const vagasAbertas = vagas.filter((v) => v.status === 'aberta').length

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Métricas</h1>
          <p className="text-muted-foreground">Visão geral do funil de recrutamento</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Label htmlFor="vaga-filter" className="text-xs text-muted-foreground">
              Filtrar por vaga
            </Label>
            <Select value={vagaSelecionada} onValueChange={setVagaSelecionada}>
              <SelectTrigger id="vaga-filter">
                <SelectValue placeholder="Todas as vagas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as vagas</SelectItem>
                {vagas.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.cargo}
                    {v.localizacao ? ` — ${v.localizacao}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-44">
            <Label htmlFor="periodo-filter" className="text-xs text-muted-foreground">
              Período
            </Label>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
              <SelectTrigger id="periodo-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Linha 1 — métricas existentes com estilo Lazuli */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-muted-foreground">
              Total Candidaturas
            </span>
            <div className="h-9 w-9 rounded-full bg-black text-amber-400 flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-black mt-4">{total}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-muted-foreground">
              Taxa de Aprovação
            </span>
            <div className="h-9 w-9 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-black mt-4">{approvalRate.toFixed(1)}%</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            {approvedCount} aprovadas
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-muted-foreground">
              Tempo Médio Funil
            </span>
            <div className="h-9 w-9 rounded-full bg-black text-amber-400 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-4xl font-black text-black mt-4">
            {avgTime.toFixed(1)}{' '}
            <span className="text-sm font-semibold text-muted-foreground">dias</span>
          </p>
        </Card>
      </div>

      {/* Linha 2 — novas métricas (cuidadores + vagas) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">
              {periodo === 'all' ? 'Total de talentos no banco' : 'Talentos novos no banco'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTalentos}</p>
            {periodo !== 'all' && (
              <p className="text-sm text-muted-foreground">últimos {periodo} dias</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Talentos disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{talentosDisponiveis}</p>
            <p className="text-sm text-muted-foreground">
              {totalTalentos > 0
                ? `${((talentosDisponiveis / totalTalentos) * 100).toFixed(0)}% do banco`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Taxa de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{conversao.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">cuidadores com candidatura</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Vagas abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{vagasAbertas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Cidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Top 5 cidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCidades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de cidade.</p>
            ) : (
              topCidades.map(([cidade, count]) => (
                <div key={cidade} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cidade}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  <Progress value={(count / maxCidade) * 100} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Distribuição por turno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Distribuição por turno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">12h</span>
                <span className="text-muted-foreground">
                  {turno12} ({totalTurno > 0 ? ((turno12 / totalTurno) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <Progress value={totalTurno > 0 ? (turno12 / totalTurno) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">24h</span>
                <span className="text-muted-foreground">
                  {turno24} ({totalTurno > 0 ? ((turno24 / totalTurno) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <Progress value={totalTurno > 0 ? (turno24 / totalTurno) * 100 : 0} className="h-2" />
            </div>
            {totalTurno === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados de turno.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Candidaturas por etapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stageData.map(({ stage, count }) => (
            <div key={stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage}</span>
                <span className="text-muted-foreground">
                  {count} ({total > 0 ? ((count / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Melhores fontes de candidatas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(sourceStats)
            .sort((a, b) => b[1] - a[1])
            .map(([origem, count]) => (
              <div key={origem} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{origem}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <Progress value={(count / maxSource) * 100} className="h-2" />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
