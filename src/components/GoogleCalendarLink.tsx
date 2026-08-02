import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarPlus } from 'lucide-react'

interface Props {
  candidataNome: string
  cargo: string
  dataHora: string
  observacoes?: string
}

export function GoogleCalendarLink({ candidataNome, cargo, dataHora, observacoes }: Props) {
  const link = useMemo(() => {
    const start = new Date(dataHora)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
        d.getUTCHours(),
      )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    const text = encodeURIComponent(`Entrevista: ${candidataNome} - ${cargo}`)
    const dates = `${fmt(start)}/${fmt(end)}`
    const details = encodeURIComponent(
      observacoes || `Entrevista com ${candidataNome} para a vaga de ${cargo}`,
    )
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
  }, [candidataNome, cargo, dataHora, observacoes])

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={link} target="_blank" rel="noopener noreferrer">
        <CalendarPlus className="mr-2 h-3.5 w-3.5" /> Google Calendar
      </a>
    </Button>
  )
}
