import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => void
}

type Phase = 'idle' | 'preview' | 'importing' | 'done'

interface PreviewRow {
  [key: string]: string
}

/** Parser CSV que respeita aspas e delimitador ';' */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ';') {
        result.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
  }
  result.push(cur)
  return result
}

async function parseCsvPreview(file: File): Promise<{ headers: string[]; rows: PreviewRow[] }> {
  const text = await file.text()
  const clean = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  const lines = clean.split('\n').filter((l) => l.trim())

  // Encontra o cabeçalho (linha com "E-mail")
  let headerIdx = 0
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const joined = lines[i].toLowerCase()
    if (joined.includes('e-mail') || joined.includes('email')) {
      headerIdx = i
      break
    }
  }
  const headers = parseCsvLine(lines[headerIdx])
  const rows: PreviewRow[] = []
  for (let i = headerIdx + 1; i < Math.min(lines.length, headerIdx + 6); i++) {
    const cells = parseCsvLine(lines[i])
    const row: PreviewRow = {}
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || ''
    })
    rows.push(row)
  }
  return { headers, rows }
}

export function ImportCsvDialog({ open, onOpenChange, onCompleted }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [dragging, setDragging] = useState(false)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [inserted, setInserted] = useState(0)
  const [updated, setUpdated] = useState(0)
  const [errors, setErrors] = useState(0)
  const [currentName, setCurrentName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPhase('idle')
    setFile(null)
    setHeaders([])
    setRows([])
    setCurrent(0)
    setTotal(0)
    setInserted(0)
    setUpdated(0)
    setErrors(0)
    setCurrentName('')
  }

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Selecione um arquivo CSV')
      return
    }
    setFile(f)
    try {
      const preview = await parseCsvPreview(f)
      setHeaders(preview.headers)
      setRows(preview.rows)
      setPhase('preview')
    } catch {
      toast.error('Erro ao ler o arquivo CSV')
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const startImport = async () => {
    if (!file) return
    setPhase('importing')
    setCurrent(0)
    setTotal(0)
    setInserted(0)
    setUpdated(0)
    setErrors(0)
    setCurrentName('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/importar-cuidadores`,
        {
          method: 'POST',
          headers: { Authorization: pb.authStore.token },
          body: formData,
        },
      )

      if (!res.ok) {
        const txt = await res.text()
        toast.error(`Erro na importação: ${txt}`)
        setPhase('preview')
        return
      }

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
            if (data.type === 'start') {
              setTotal(data.total)
            } else if (data.type === 'progress') {
              setCurrent(data.current)
              setInserted(data.inserted)
              setUpdated(data.updated)
              setErrors(data.errors)
              setCurrentName(data.nome || '')
            } else if (data.type === 'done') {
              setInserted(data.inserted)
              setUpdated(data.updated)
              setErrors(data.errors)
              setPhase('done')
              toast.success(
                `Importação concluída: ${data.inserted} novos, ${data.updated} atualizados`,
              )
              onCompleted()
            }
          } catch {
            /* ignore */
          }
        }
      }
      // Caso o stream termine sem evento done
      if (phase !== 'done') setPhase('done')
    } catch {
      toast.error('Erro de comunicação com o servidor')
      setPhase('preview')
    }
  }

  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Cuidadoras (CSV)</DialogTitle>
        </DialogHeader>

        {phase === 'idle' && (
          <div className="space-y-4">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              )}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Arraste e solte o arquivo CSV aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Instruções:</p>
              <p>• O arquivo deve estar no formato CSV com delimitador ponto e vírgula (;)</p>
              <p>• A importação faz upsert por CPF ou e-mail (atualiza registros existentes)</p>
              <p>• Colunas ignoradas: Currículo e Foto (URLs externas não são importadas)</p>
            </div>
          </div>
        )}

        {phase === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{file?.name}</span>
              <span className="text-muted-foreground">({(file?.size / 1024).toFixed(0)} KB)</span>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Pré-visualização (5 primeiras linhas):</p>
              <div className="overflow-x-auto rounded-lg border max-h-72">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {headers.slice(0, 8).map((h, i) => (
                        <th key={i} className="text-left p-2 font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="border-t">
                        {headers.slice(0, 8).map((h, ci) => (
                          <td key={ci} className="p-2 max-w-[160px] truncate align-top">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {headers.length > 8 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{headers.length - 8} colunas adicionais não exibidas na prévia
                </p>
              )}
            </div>
          </div>
        )}

        {phase === 'importing' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Importando {current} de {total}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
            {currentName && (
              <p className="text-xs text-muted-foreground truncate">Processando: {currentName}</p>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-2">
                <p className="text-lg font-bold text-green-600">{inserted}</p>
                <p className="text-xs text-muted-foreground">Novos</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
                <p className="text-lg font-bold text-blue-600">{updated}</p>
                <p className="text-xs text-muted-foreground">Atualizados</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
                <p className="text-lg font-bold text-red-600">{errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
              Não feche esta janela até a conclusão.
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Importação concluída!</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                <p className="text-2xl font-bold text-green-600">{inserted}</p>
                <p className="text-xs text-muted-foreground">Novos cadastros</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <p className="text-2xl font-bold text-blue-600">{updated}</p>
                <p className="text-xs text-muted-foreground">Atualizados</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <p className="text-2xl font-bold text-red-600">{errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
            {errors > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-3">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  {errors} linha(s) não puderam ser importadas. Verifique o log do servidor para
                  detalhes. Linhas sem nome, e-mail e CPF são puladas automaticamente.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {phase === 'idle' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          {phase === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  reset()
                }}
              >
                Trocar arquivo
              </Button>
              <Button onClick={startImport}>
                <Upload className="mr-2 h-4 w-4" />
                Iniciar importação
              </Button>
            </>
          )}
          {phase === 'importing' && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </Button>
          )}
          {phase === 'done' && (
            <Button
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
            >
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
