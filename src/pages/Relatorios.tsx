import { useState, useEffect, useCallback } from 'react'
import { getApplications, type Application } from '@/services/applications'
import { getVagas, type Vaga } from '@/services/vagas'
import { getCandidatas, type Candidata } from '@/services/candidatas'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, TrendingUp, Users, BarChart3 } from 'lucide-react'

function EmptyState() {
  return (
    <p className="py-4 text-center text-sm text-muted-foreground">
      Sem dados suficientes para exibir este relatório
    </p>
  )
}

export default function Relatorios() {
  const [applications, setApplications] = useState<Application[]>([])
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatas, setCandidatas] = useState<Candidata[]>([])

  const load = useCallback(async () => {
    try {
      const [apps, vs, cs] = await Promise.all([getApplications(), getVagas(), getCandidatas()])
      setApplications(apps)
      setVagas(vs)
      setCandidatas(cs)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('applications', () => load())
  useRealtime('vagas', () => load())
  useRealtime('candidatas', () => load())

  const approvedApps = applications.filter((a) => a.etapa === 'Aprovada')
  const timeToHire =
    approvedApps.length > 0
      ? approvedApps.reduce((sum, a) => {
          const diff = new Date(a.updated).getTime() - new Date(a.created).getTime()
          return sum + diff / (1000 * 60 * 60 * 24)
        }, 0) / approvedApps.length
      : null

  const vagaStats = vagas.map((vaga) => {
    const vagaApps = applications.filter((a) => a.vaga === vaga.id)
    const approved = vagaApps.filter((a) => a.etapa === 'Aprovada').length
    const total = vagaApps.length
    const rate = total > 0 ? (approved / total) * 100 : 0
    return { vaga, total, approved, rate }
  })

  const sourceCounts: Record<string, number> = {}
  candidatas.forEach((c) => {
    const origem = c.origem || 'Não informado'
    sourceCounts[origem] = (sourceCounts[origem] || 0) + 1
  })
  const maxSourceCount = Math.max(...Object.values(sourceCounts), 1)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Métricas de recrutamento e seleção</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Tempo médio de contratação</CardTitle>
          </CardHeader>
          <CardContent>
            {timeToHire !== null ? (
              <p className="text-3xl font-bold">
                {timeToHire.toFixed(1)}{' '}
                <span className="text-base font-normal text-muted-foreground">dias</span>
              </p>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Total de candidaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{applications.length}</p>
            <p className="text-sm text-muted-foreground">{approvedApps.length} aprovadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-medium">Total de candidatas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{candidatas.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Taxa de Aprovação por Vaga
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vagaStats.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {vagaStats.map(({ vaga, total, approved, rate }) => (
                <div key={vaga.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{vaga.cargo}</span>
                    <span className="text-muted-foreground">
                      {approved}/{total} aprovadas ({rate.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={rate} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Origem das Candidatas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {candidatas.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {Object.entries(sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([origem, count]) => (
                  <div key={origem} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{origem}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <Progress value={(count / maxSourceCount) * 100} className="h-2" />
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
