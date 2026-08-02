import { useState, useEffect, useCallback } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { getCandidatas } from '@/services/candidatas'
import { getApplications, type Application } from '@/services/applications'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, ClipboardCheck, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stats {
  vagasAbertas: number
  totalCandidatas: number
  triagem: number
  entrevista: number
  aprovada: number
  rejeitada: number
}

export default function Index() {
  const [stats, setStats] = useState<Stats>({
    vagasAbertas: 0,
    totalCandidatas: 0,
    triagem: 0,
    entrevista: 0,
    aprovada: 0,
    rejeitada: 0,
  })

  const load = useCallback(async () => {
    try {
      const [vagas, candidatas, apps] = await Promise.all([
        getVagas(),
        getCandidatas(),
        getApplications(),
      ])
      setStats({
        vagasAbertas: vagas.filter((v: Vaga) => v.status === 'aberta').length,
        totalCandidatas: candidatas.length,
        triagem: apps.filter((a: Application) => a.etapa === 'Triagem').length,
        entrevista: apps.filter((a: Application) => a.etapa === 'Entrevista').length,
        aprovada: apps.filter((a: Application) => a.etapa === 'Aprovada').length,
        rejeitada: apps.filter((a: Application) => a.etapa === 'Rejeitada').length,
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('vagas', () => load())
  useRealtime('candidatas', () => load())
  useRealtime('applications', () => load())

  const cards = [
    { title: 'Vagas Abertas', value: stats.vagasAbertas, icon: Briefcase, color: 'text-blue-600' },
    {
      title: 'Total de Candidatas',
      value: stats.totalCandidatas,
      icon: Users,
      color: 'text-green-600',
    },
    { title: 'Triagem', value: stats.triagem, icon: ClipboardCheck, color: 'text-amber-600' },
    { title: 'Entrevista', value: stats.entrevista, icon: Clock, color: 'text-purple-600' },
    { title: 'Aprovadas', value: stats.aprovada, icon: CheckCircle2, color: 'text-green-600' },
    { title: 'Rejeitadas', value: stats.rejeitada, icon: XCircle, color: 'text-red-600' },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do processo de recrutamento</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn('h-5 w-5', card.color)} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
