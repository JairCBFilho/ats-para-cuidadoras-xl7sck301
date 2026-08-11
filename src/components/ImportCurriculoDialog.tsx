import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => void
}

type Phase = 'idle' | 'extracting' | 'review' | 'creating' | 'done'

interface ExtractedData {
  nome: string
  email: string
  telefone: string
  cpf: string
  data_nascimento: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  formacao: string
  curso_cuidador: string
  tempo_experiencia: string
  experiencia_ilp: string
  outros_cursos: string
  referencias: string
  disponibilidade: string
  turno: string
}

const EMPTY_DATA: ExtractedData = {
  nome: '',
  email: '',
  telefone: '',
  cpf: '',
  data_nascimento: '',
  endereco: '',
  bairro: '',
  cidade: '',
  uf: '',
  formacao: '',
  curso_cuidador: '',
  tempo_experiencia: '',
  experiencia_ilp: '',
  outros_cursos: '',
  referencias: '',
  disponibilidade: '',
  turno: '',
}

/** Lê um File (PDF) como base64 (sem o prefixo data:). */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result vem como "data:application/pdf;base64,XXXX"
      const commaIdx = result.indexOf(',')
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result)
    }
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

export function ImportCurriculoDialog({ open, onOpenChange, onCompleted }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ExtractedData>(EMPTY_DATA)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPhase('idle')
    setFile(null)
    setData(EMPTY_DATA)
    setCreatedId(null)
  }

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Selecione um arquivo PDF')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10 MB')
      return
    }
    setFile(f)
    setPhase('idle')
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

  const extract = async () => {
    if (!file) return
    setPhase('extracting')
    try {
      const content = await readFileAsBase64(file)
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/extract-curriculo`,
        {
          method: 'POST',
          headers: {
            Authorization: pb.authStore.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        },
      )

      if (!res.ok) {
        let msg = 'Erro ao extrair dados do currículo'
        try {
          const body = await res.json()
          if (body?.error) msg = body.error
        } catch {
          // ignore
        }
        toast.error(msg)
        setPhase('idle')
        return
      }

      const result = (await res.json()) as Partial<ExtractedData>
      setData({ ...EMPTY_DATA, ...result })
      setPhase('review')
      toast.success('Dados extraídos! Revise antes de confirmar.')
    } catch {
      toast.error('Erro de comunicação com o servidor')
      setPhase('idle')
    }
  }

  const confirmCreate = async () => {
    if (!data.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!data.email.trim()) {
      toast.error('E-mail é obrigatório')
      return
    }
    setPhase('creating')
    try {
      const payload: Record<string, unknown> = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cpf: data.cpf,
        nascimento: data.data_nascimento,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        formacao: data.formacao,
        curso_cuidador: data.curso_cuidador,
        tempo_experiencia: data.tempo_experiencia,
        experiencia_ilp: data.experiencia_ilp,
        outros_cursos_experiencias: data.outros_cursos,
        referencias: data.referencias,
        disponibilidade:
          data.disponibilidade.toLowerCase().indexOf('indispon') !== -1
            ? 'indisponível'
            : 'disponível',
        turno: data.turno,
        localizacao: [data.cidade, data.uf].filter(Boolean).join('/') || '',
        experiencia: data.tempo_experiencia,
        origem: 'Outro',
      }

      if (file) payload.curriculo = file

      const record = await pb
        .collection('cuidadores')
        .create<{ id: string }>(payload as Record<string, unknown>)
      setCreatedId(record.id)
      setPhase('done')
      toast.success('Cuidadora criada com sucesso!', {
        description: 'Clique para abrir o perfil no Banco de Talentos.',
        action: {
          label: 'Ver perfil',
          onClick: () => window.open(`/banco-talentos`, '_blank'),
        },
      })
      onCompleted()
    } catch (err) {
      toast.error('Erro ao criar cuidadora. Verifique os dados e tente novamente.')
      console.error(err)
      setPhase('review')
    }
  }

  const set = <K extends keyof ExtractedData>(key: K, value: string) =>
    setData((d) => ({ ...d, [key]: value }))

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
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Importar Currículo (PDF)
          </DialogTitle>
        </DialogHeader>

        {phase === 'extracting' ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Extraindo dados do currículo...</p>
            <p className="text-xs text-muted-foreground">A IA está analisando o PDF.</p>
          </div>
        ) : phase === 'review' || phase === 'creating' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">{file?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setFile(null)
                  setData(EMPTY_DATA)
                  setPhase('idle')
                }}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Trocar arquivo
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Dados extraídos — revise e corrija antes de confirmar
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="ic-nome">Nome *</Label>
                <Input
                  id="ic-nome"
                  value={data.nome}
                  onChange={(e) => set('nome', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-email">E-mail *</Label>
                <Input
                  id="ic-email"
                  type="email"
                  value={data.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-telefone">Telefone</Label>
                <Input
                  id="ic-telefone"
                  value={data.telefone}
                  onChange={(e) => set('telefone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-cpf">CPF</Label>
                <Input id="ic-cpf" value={data.cpf} onChange={(e) => set('cpf', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ic-nasc">Data de Nascimento</Label>
                <Input
                  id="ic-nasc"
                  value={data.data_nascimento}
                  placeholder="dd/mm/aaaa"
                  onChange={(e) => set('data_nascimento', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ic-end">Endereço</Label>
                <Input
                  id="ic-end"
                  value={data.endereco}
                  onChange={(e) => set('endereco', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-bairro">Bairro</Label>
                <Input
                  id="ic-bairro"
                  value={data.bairro}
                  onChange={(e) => set('bairro', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-cidade">Cidade</Label>
                <Input
                  id="ic-cidade"
                  value={data.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-uf">UF</Label>
                <Input
                  id="ic-uf"
                  value={data.uf}
                  maxLength={2}
                  onChange={(e) => set('uf', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="ic-formacao">Formação</Label>
                <Input
                  id="ic-formacao"
                  value={data.formacao}
                  onChange={(e) => set('formacao', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ic-curso">Curso de Cuidador</Label>
                <Input
                  id="ic-curso"
                  value={data.curso_cuidador}
                  onChange={(e) => set('curso_cuidador', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-tempo">Tempo de Experiência</Label>
                <Input
                  id="ic-tempo"
                  value={data.tempo_experiencia}
                  onChange={(e) => set('tempo_experiencia', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-ilp">Experiência ILP/ILPI</Label>
                <Input
                  id="ic-ilp"
                  value={data.experiencia_ilp}
                  onChange={(e) => set('experiencia_ilp', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-disp">Disponibilidade</Label>
                <Input
                  id="ic-disp"
                  value={data.disponibilidade}
                  onChange={(e) => set('disponibilidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ic-turno">Turno</Label>
                <Input
                  id="ic-turno"
                  value={data.turno}
                  onChange={(e) => set('turno', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ic-outros">Outros Cursos</Label>
                <Textarea
                  id="ic-outros"
                  rows={2}
                  value={data.outros_cursos}
                  onChange={(e) => set('outros_cursos', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ic-refs">Referências</Label>
                <Textarea
                  id="ic-refs"
                  rows={2}
                  value={data.referencias}
                  onChange={(e) => set('referencias', e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : phase === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Cuidadora criada com sucesso!</p>
            {createdId && (
              <Button asChild variant="outline">
                <a href="/banco-talentos" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Abrir Banco de Talentos
                </a>
              </Button>
            )}
          </div>
        ) : (
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
              <p className="text-sm font-medium">Arraste e solte o currículo em PDF aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate">{file.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {(file.size / 1024).toFixed(0)} KB
                </Badge>
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Como funciona:</p>
              <p>• Selecione um currículo em PDF de uma cuidadora de idosos</p>
              <p>• A IA extrai nome, contato, formação, experiência e disponibilidade</p>
              <p>• Você revisa os dados extraídos e confirma para criar o cadastro</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === 'idle' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={extract} disabled={!file}>
                <Sparkles className="mr-2 h-4 w-4" /> Extrair dados
              </Button>
            </>
          )}
          {phase === 'review' && (
            <>
              <Button variant="outline" onClick={() => setPhase('idle')}>
                Voltar
              </Button>
              <Button onClick={confirmCreate}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar e criar cuidadora
              </Button>
            </>
          )}
          {phase === 'creating' && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
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
