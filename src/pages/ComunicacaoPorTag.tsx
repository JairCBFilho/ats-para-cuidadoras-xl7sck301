import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import { ComunicacaoPorTagDialog } from '@/components/ComunicacaoPorTagDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ComunicacaoPorTag() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Megaphone className="h-6 w-6 text-primary" /> Comunicação por Tag
        </h1>
        <p className="text-sm text-muted-foreground">
          Envie e-mail ou WhatsApp para todas as cuidadoras que possuem tags específicas
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-lg font-medium">Disparo de comunicação por tag</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione uma ou mais tags, escolha o canal (e-mail ou WhatsApp) e um template para
              alcançar todas as cuidadoras que possuam pelo menos uma das tags selecionadas.
            </p>
          </div>
          <Button size="lg" onClick={() => setOpen(true)}>
            <Megaphone className="mr-2 h-4 w-4" /> Novo disparo
          </Button>
        </CardContent>
      </Card>

      <ComunicacaoPorTagDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
