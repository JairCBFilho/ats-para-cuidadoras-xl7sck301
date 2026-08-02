import { useState, useEffect } from 'react'
import { getVagas, type Vaga } from '@/services/vagas'
import { calcularCompatibilidade, type CompatibilidadeResult } from '@/services/compatibilidade'
import { getApplicationsByCandidata, updateApplication } from '@/services/applications'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Sparkles, AlertCircle, ThumbsUp, AlertTriangle } from 'lucide-react'
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
      .then((all) => setVagas(all.filter((v) => v.status === 'aberta')))
      .catch(() => setHasError(true))
      .finally(() => setVagasLoading(false))
  }, [])

  const loadExisting = async (vagaId: string) => {
    try {
      const apps = await getApplicationsByCandidata(candidataId)
      const app = apps.find((a) => a.vaga === vagaId)
      if (app && app.compatibilidade !== undefined && app.compatibilidade !== null) {
        setResult({
          score: app.compatibilidade,
          justificativa: app.justificativa || 'Compatibilidade calculada anteriormente.',
          pontos_fortes: app.pontos_fortes || '',
          pontos_atencao: app.pontos_atencao || '',
        })
      } else {
        setResult(null)
      }
    } catch {
      /* ignore */
    }
  }

  const handleVagaChange = async (vagaId: string) => {
    setSelectedVaga(vagaId)
    setResult(null)
    await loadExisting(vagaId)
  }
  useRealtime('applications', () => {
    if (selectedVaga) loadExisting(selectedVaga)
  })

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
        if (app)
          await updateApplication(app.id, {
            compatibilidade: res.score,
            justificativa: res.justificativa,
            pontos_fortes: res.pontos_fortes,
            pontos_atencao: res.pontos_atencao,
          })
        toast.success('Compatibilidade calculada e salva!')
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
            Não há vagas abertas.
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
                Erro ao calcular. Tente novamente.
              </div>
            )}
            {result && (
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Compatibilidade:</span>
                  <span className="text-2xl font-bold text-primary">{result.score}%</span>
                </div>
                {result.pontos_fortes && (
                  <div className="flex items-start gap-2">
                    <ThumbsUp className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-green-700">Pontos fortes</p>
                      <p className="text-sm">{result.pontos_fortes}</p>
                    </div>
                  </div>
                )}
                {result.pontos_atencao && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-700">Pontos de atenção</p>
                      <p className="text-sm">{result.pontos_atencao}</p>
                    </div>
                  </div>
                )}
                {result.justificativa && (
                  <p className="text-sm text-muted-foreground pt-1 border-t">
                    {result.justificativa}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
