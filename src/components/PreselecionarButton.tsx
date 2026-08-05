import { useState } from 'react'
import { Wand2, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

interface Props {
  vagaId: string
  onCompleted?: () => void
}

export function PreselecionarButton({ vagaId, onCompleted }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [promoted, setPromoted] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const start = async () => {
    setOpen(true)
    setRunning(true)
    setDone(false)
    setCurrent(0)
    setTotal(0)
    setPromoted(0)

    const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/preselecionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
      body: JSON.stringify({ vaga_id: vagaId }),
    })

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
          else if (data.type === 'progress') {
            setCurrent(data.current)
            setPromoted(data.promoted || 0)
          } else if (data.type === 'done') {
            setRunning(false)
            setDone(true)
            setPromoted(data.promoted || 0)
            toast.success(`${data.promoted} cuidadora(s) promovida(s) à candidata(s)!`)
            onCompleted?.()
            setTimeout(() => setOpen(false), 2000)
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
  }

  return (
    <>
      <Button size="sm" variant="default" onClick={start} disabled={running}>
        {running ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-3.5 w-3.5" />
        )}
        Pré-selecionar com IA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pré-seleção com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {total > 0 && <Progress value={(current / total) * 100} />}
            {done ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Concluído!
                </p>
                <p className="text-sm text-muted-foreground">
                  {total} cuidadoras analisadas, {promoted} promovidas a candidatas.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {total > 0
                  ? `Analisando ${current} de ${total} cuidadoras... (${promoted} promovidas)`
                  : 'Iniciando...'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
