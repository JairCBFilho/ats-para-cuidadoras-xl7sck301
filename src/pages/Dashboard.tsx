import { useState, useEffect, useMemo, useCallback } from 'react'
import { getApplications, type Application } from '@/services/applications'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import { getCuidadores, type Cuidador } from '@/services/cuidadores'
import { getVagas } from '@/services/vagas'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([])
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [vagasAbertas, setVagasAbertas] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [a, c, cuid, vagas] = await Promise.all([
        getApplications(),
        getCandidatas(),
        getCuidadores(),
        getVagas(),
      ])
      setApps(a)
      setCandidatas(c)
      setCuidadores(cuid)
      setVagasAbertas(vagas.filter((v) => v.status === 'aberta').length)
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

  // Métricas existentes (applications + candidatas)
  const total = apps.length
  const stageData = STAGES.map((stage) => ({
    stage,
    count: apps.filter((a) => a.etapa === stage).length,
  }))
  const approvedCount = stageData.find((s) => s.stage === 'Aprovada')?.count || 0
  const approvalRate = total > 0 ? (approvedCount / total) * 100 : 0
  const avgTime =
    total > 0
      ? apps.reduce((sum, a) => {
          const end =
            a.etapa === 'Aprovada' || a.etapa === 'Rejeitada'
              ? new Date(a.updated).getTime()
              : Date.now()
          return sum + (end - new Date(a.created).getTime()) / (1000 * 60 * 60 * 24)
        }, 0) / total
      : 0

  const sourceStats: Record<string, number> = {}
  apps.forEach((app) => {
    const c = candidatas.find((cnd) => cnd.id === app.candidata)
    const origem = c?.origem || 'Não informado'
    sourceStats[origem] = (sourceStats[origem] || 0) + 1
  })
  const maxSource = Math.max(...Object.values(sourceStats), 1)

  // Novas métricas (cuidadores)
  const totalTalentos = cuidadores.length
  const talentosDisponiveis = cuidadores.filter((c) => c.disponibilidade === 'disponível').length

  // Top 5 cidades
  const cidadesStats: Record<string, number> = {}
  cuidadores.forEach((c) => {
    const cidade = (c.cidade || '').trim()
    if (cidade) cidadesStats[cidade] = (cidadesStats[cidade] || 0) + 1
  })
  const topCidades = Object.entries(cidadesStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCidade = Math.max(...topCidades.map(([, n]) => n), 1)

  // Taxa de conversão: % de cuidadores com pelo menos uma candidatura
  // (cuidador cujo email ou cpf também existe em uma candidatura que tem application)
  const conversao = useMemo(() => {
    if (cuidadores.length === 0) return 0
    // Mapa de candidatas por email e por cpf (lowercase), e ids de candidatas com application
    const candByEmail = new Map<string, string>() // email -> candidata.id
    const candByCpf = new Map<string, string>() // cpf -> candidata.id
    candidatas.forEach((c) => {
      const email = (c.email || '').toLowerCase()
      if (email) candByEmail.set(email, c.id)
    })
    // candidatas também podem possuir cpf (importação CSV); o tipo Candidata não expõe,
    // mas o registro PocketBase pode conter — usamos acesso seguro.
    candidatas.forEach((c) => {
      const cpf = String((c as unknown as Record<string, unknown>).cpf || '').toLowerCase()
      if (cpf) candByCpf.set(cpf, c.id)
    })
    const appsCandIds = new Set(apps.map((a) => a.candidata))

    let comApp = 0
    cuidadores.forEach((cuid) => {
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
    return (comApp / cuidadores.length) * 100
  }, [cuidadores, candidatas, apps])

  // Distribuição por turno
  const turno12 = cuidadores.filter((c) => c.turno === '12h').length
  const turno24 = cuidadores.filter((c) => c.turno === '24h').length
  const totalTurno = turno12 + turno24

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Métricas</h1>
        <p className="text-muted-foreground">Visão geral do funil de recrutamento</p>
      </div>

      {/* Linha 1 — métricas existentes */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Total de candidaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Taxa de aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{approvalRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">{approvedCount} aprovadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Tempo médio no funil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {avgTime.toFixed(1)}{' '}
              <span className="text-base font-normal text-muted-foreground">dias</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2 — novas métricas (cuidadores + vagas) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Total de talentos no banco</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTalentos}</p>
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
