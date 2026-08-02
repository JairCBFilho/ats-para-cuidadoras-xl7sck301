import { useState, useEffect } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { calcularCompatibilidade, type CompatibilidadeResult } from '@/services/compatibilidade'
import { getApplicationsByCandidata, updateApplication } from '@/services/applications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  candidataId: string
}

export function CompatibilidadeSection({ candidataId }: Props) {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [selectedVaga, setSelectedVaga] = useState('')
  const [result, setResult] = useState<CompatibilidadeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [vagasLoading, setVagasLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    getVagas()
      .then((all) => {
        setVagas(all.filter((v) => v.status === 'aberta'))
      })
      .catch(() => {
        setHasError(true)
      })
      .finally(() => setVagasLoading(false))
  }, [])

  const handleVagaChange = async (vagaId: string) => {
    setSelectedVaga(vagaId)
    setResult(null)
    try {
      const apps = await getApplicationsByCandidata(candidataId)
      const app = apps.find((a) => a.vaga === vagaId)
      if (app && app.compatibilidade !== undefined && app.compatibilidade !== null) {
        setResult({
          score: app.compatibilidade,
          justificativa: 'Compatibilidade calculada anteriormente.',
        })
      }
    } catch {
      /* ignore */
    }
  }

  const handleCalc = async () => {
    if (!selectedVaga) return
    setLoading(true)
    setResult(null)
    setHasError(false)
    try {
      const res = await calcularCompatibilidade(candidataId, selectedVaga)
      setResult(res)
      try {
        const apps = await getApplicationsByCandidata(candidataId)
        const app = apps.find((a) => a.vaga === selectedVaga)
        if (app) {
          await updateApplication(app.id, { compatibilidade: res.score })
          toast.success('Compatibilidade calculada e salva!')
        } else {
          toast.success('Compatibilidade calculada!')
        }
      } catch {
        toast.success('Compatibilidade calculada!')
      }
    } catch (err) {
      setHasError(true)
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Compatibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {vagasLoading ? (
          <p className="text-sm text-muted-foreground">Carregando vagas...</p>
        ) : vagas.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Não há vagas abertas disponíveis para calcular compatibilidade.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={selectedVaga || undefined} onValueChange={handleVagaChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma vaga" />
                </SelectTrigger>
                <SelectContent>
                  {vagas.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCalc} disabled={!selectedVaga || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Calcular compatibilidade
              </Button>
            </div>
            {hasError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Erro ao calcular compatibilidade. Tente novamente.
              </div>
            )}
            {result && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Grau de compatibilidade:</span>
                  <span className="text-2xl font-bold text-primary">{result.score}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{result.justificativa}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
