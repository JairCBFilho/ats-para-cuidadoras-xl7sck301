import { useState, useEffect, useCallback } from 'react'
import { getApplications, type Application } from '@/services/applications'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Clock, Users, Target } from 'lucide-react'

const STAGES = ['Triagem', 'Entrevista', 'Aprovada', 'Rejeitada'] as const

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([])
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([getApplications(), getCandidatas()])
      setApps(a)
      setCandidatas(c)
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

  if (loading) return <div className="p-6 text-muted-foreground">Carregando...</div>

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Métricas</h1>
        <p className="text-muted-foreground">Visão geral do funil de recrutamento</p>
      </div>

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
