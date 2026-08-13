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

  const taskProgress =
    stats.totalCandidatas > 0 ? Math.round((stats.aprovada / stats.totalCandidatas) * 100) : 18

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Header - Lazuli style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">
            Bem-vinda, Equipe <span className="text-amber-500 font-black">✦</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Acompanhe o progresso de contratações e recrutamento em tempo real.
          </p>
        </div>

        {/* Minimal Numerical Indicators (Top Right in Lazuli visual) */}
        <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-black/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="text-2xl font-black text-black leading-none">
                {stats.totalCandidatas}
              </span>
              <p className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                Cuidadores
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-black/10" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <span className="text-2xl font-black text-black leading-none">
                {stats.vagasAbertas}
              </span>
              <p className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                Vagas
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-black/10" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-amber-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-2xl font-black text-black leading-none">{stats.aprovada}</span>
              <p className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                Contratações
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Lazuli Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Central Column: Metrics and Progress Bars */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Hero Card + Mini Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 bg-white/90 border-white/60 p-6 flex flex-col justify-between shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">
                    Progresso do Funil
                  </span>
                  <h3 className="text-3xl font-black text-black mt-1">Taxa de Conversão</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-400 flex items-center justify-center text-black font-black text-sm">
                  {taskProgress}%
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs font-bold text-black">
                  <span>Candidatas -&gt; Aprovadas</span>
                  <span>
                    {stats.aprovada} de {stats.totalCandidatas}
                  </span>
                </div>
                {/* Yellow rounded progress bar as shown in Lazuli */}
                <div className="h-4 w-full bg-amber-100 rounded-full p-0.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(taskProgress, 5)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Aumento de volume no banco de talentos ativo esta semana.
                </p>
              </div>
            </Card>

            {/* Dark Accent Pill/Card */}
            <Card className="bg-black text-white border-black p-6 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                  Destaque
                </span>
                <h4 className="text-xl font-bold mt-1 text-white">Vagas Ativas</h4>
                <p className="text-xs text-neutral-400 mt-2">
                  Existem {stats.vagasAbertas} vagas abertas aguardando triagem.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-2xl font-black text-amber-400">{stats.vagasAbertas}</span>
                <span className="text-xs text-neutral-300 font-semibold px-3 py-1 bg-neutral-800 rounded-full">
                  Status OK
                </span>
              </div>
            </Card>
          </div>

          {/* Cards de Métricas por Etapa (Soft White Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Triagem</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-black">{stats.triagem}</span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Fase 1
                </span>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Entrevistas</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-black">{stats.entrevista}</span>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Fase 2
                </span>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Aprovadas</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-black">{stats.aprovada}</span>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  Sucesso
                </span>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase">Rejeitadas</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-black">{stats.rejeitada}</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Finalizado
                </span>
              </div>
            </Card>
          </div>

          {/* Additional visual section: Recrutamento Ativo */}
          <Card className="p-6">
            <h4 className="text-base font-extrabold text-black mb-4 flex items-center justify-between">
              <span>Etapas do Processo Seletivo</span>
              <span className="text-xs font-normal text-muted-foreground">
                Volume de candidaturas
              </span>
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-black font-bold">1. Entrada & Triagem Inicial</span>
                  <span className="text-muted-foreground">{stats.triagem} candidatas</span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full"
                    style={{
                      width:
                        stats.totalCandidatas > 0
                          ? `${(stats.triagem / stats.totalCandidatas) * 100}%`
                          : '20%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-black font-bold">2. Entrevista Técnica & Checagem</span>
                  <span className="text-muted-foreground">{stats.entrevista} candidatas</span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{
                      width:
                        stats.totalCandidatas > 0
                          ? `${(stats.entrevista / stats.totalCandidatas) * 100}%`
                          : '35%',
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-black font-bold">3. Finalização & Contratação</span>
                  <span className="text-muted-foreground">{stats.aprovada} contratadas</span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full"
                    style={{
                      width:
                        stats.totalCandidatas > 0
                          ? `${(stats.aprovada / stats.totalCandidatas) * 100}%`
                          : '15%',
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Dark Card "Onboarding / Task List" exact like Lazuli image */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1e1e1e] text-white rounded-[2rem] p-6 shadow-2xl border border-neutral-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  Progresso
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">Tarefas de Onboarding</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white">4/6</span>
              </div>
            </div>

            {/* Task list with circular icons and yellow checkmarks */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-neutral-700">
                    01
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Cadastro de perfil completo</p>
                    <p className="text-[10px] text-neutral-400">Verificação de documentos</p>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-sm">
                  ✓
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-neutral-700">
                    02
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Entrevista técnica inicial</p>
                    <p className="text-[10px] text-neutral-400">Avaliação de experiência</p>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-sm">
                  ✓
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-neutral-700">
                    03
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Checagem de referências</p>
                    <p className="text-[10px] text-neutral-400">Contato com ex-empregadores</p>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-sm">
                  ✓
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-neutral-700">
                    04
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Match com vaga de Cuidador</p>
                    <p className="text-[10px] text-neutral-400">Vinculação de perfil</p>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-sm">
                  ✓
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 opacity-80">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800/60 flex items-center justify-center text-neutral-400 font-bold text-xs border border-neutral-800">
                    05
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-300">Treinamento de alinhamento</p>
                    <p className="text-[10px] text-neutral-500">Módulo online</p>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full border-2 border-neutral-700 flex items-center justify-center" />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 opacity-80">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-neutral-800/60 flex items-center justify-center text-neutral-400 font-bold text-xs border border-neutral-800">
                    06
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-300">Assinatura do contrato</p>
                    <p className="text-[10px] text-neutral-500">Admissão final</p>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full border-2 border-neutral-700 flex items-center justify-center" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
