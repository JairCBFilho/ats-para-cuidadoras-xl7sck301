import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

interface Props {
  vagaId: string
  onCompleted?: () => void
}

export function BatchCompatibilidadeButton({ vagaId, onCompleted }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const start = async () => {
    setOpen(true)
    setRunning(true)
    setDone(false)
    setCurrent(0)
    setTotal(0)

    const res = await fetch(
      `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/compatibilidade/batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
        body: JSON.stringify({ vagaId }),
      },
    )

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done: readerDone, value } = await reader.read()
      if (readerDone) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      for (const event of events) {
        if (!event.startsWith('data: ')) continue
        try {
          const data = JSON.parse(event.slice(6))
          if (data.type === 'start') setTotal(data.total)
          else if (data.type === 'progress') setCurrent(data.current)
          else if (data.type === 'done') {
            setRunning(false)
            setDone(true)
            toast.success(`Compatibilidade calculada para ${data.total} candidatas!`)
            onCompleted?.()
            setTimeout(() => setOpen(false), 1500)
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={start} disabled={running}>
        {running ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-3.5 w-3.5" />
        )}
        Calcular em lote
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculando compatibilidade em lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {total > 0 && <Progress value={(current / total) * 100} />}
            {done ? (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Concluído! {total} candidatas analisadas.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {total > 0 ? `Calculando ${current} de ${total} candidatas...` : 'Iniciando...'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
