import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotificacoes, markAsRead, type Notificacao } from '@/services/notificacoes'
import { useRealtime } from '@/hooks/use-realtime'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    try {
      setNotificacoes(await getNotificacoes())
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])
  useRealtime('notificacoes', () => load())

  const unread = notificacoes.filter((n) => !n.lida)

  const handleClick = async (n: Notificacao) => {
    if (!n.lida) {
      try {
        await markAsRead(n.id)
      } catch {
        /* ignore */
      }
    }
    if (n.candidata) navigate(`/candidatas/${n.candidata}`)
  }

  if (loading) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {notificacoes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
        ) : (
          notificacoes.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                'cursor-pointer flex-col items-start gap-1 py-3',
                !n.lida && 'bg-primary/5',
              )}
            >
              <p className="text-sm font-medium">{n.mensagem}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(n.created).toLocaleString('pt-BR')}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
