import { useState } from 'react'
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
import { Sparkles, Loader2, CheckCircle2, FileText, AlertCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { updateCuidador, type Cuidador } from '@/services/cuidadores'
import { toast } from 'sonner'

export interface ExtractedCurriculoData {
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

const EMPTY_DATA: ExtractedCurriculoData = {
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

interface ExtrairCurriculoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuidador: Cuidador | null
  onSuccess?: () => void
  /** Se fornecido, aplica diretamente no form local sem necessariamente persistir de imediato */
  onApplyToForm?: (extracted: ExtractedCurriculoData) => void
}

export function ExtrairCurriculoModal({
  open,
  onOpenChange,
  cuidador,
  onSuccess,
  onApplyToForm,
}: ExtrairCurriculoModalProps) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'review' | 'saving'>('idle')
  const [data, setData] = useState<ExtractedCurriculoData>(EMPTY_DATA)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleStartExtraction = async () => {
    if (!cuidador?.id) {
      toast.error('Nenhuma cuidadora selecionada')
      return
    }

    setPhase('loading')
    setErrorMsg(null)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/extract-curriculo`,
        {
          method: 'POST',
          headers: {
            Authorization: pb.authStore.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cuidador_id: cuidador.id }),
        },
      )

      if (!res.ok) {
        let msg = 'Não foi possível extrair os dados do currículo.'
        try {
          const body = await res.json()
          if (body?.error) msg = body.error
        } catch {
          /* intentionally ignored */
        }
        setErrorMsg(msg)
        setPhase('idle')
        toast.error(msg)
        return
      }

      const result = (await res.json()) as Partial<ExtractedCurriculoData>
      setData({
        nome: result.nome || cuidador.nome || '',
        email: result.email || cuidador.email || '',
        telefone: result.telefone || cuidador.telefone || '',
        cpf: result.cpf || cuidador.cpf || '',
        data_nascimento: result.data_nascimento || cuidador.nascimento || '',
        endereco: result.endereco || cuidador.endereco || '',
        bairro: result.bairro || cuidador.bairro || '',
        cidade: result.cidade || cuidador.cidade || '',
        uf: result.uf || cuidador.uf || '',
        formacao: result.formacao || cuidador.formacao || '',
        curso_cuidador: result.curso_cuidador || cuidador.curso_cuidador || '',
        tempo_experiencia: result.tempo_experiencia || cuidador.tempo_experiencia || '',
        experiencia_ilp: result.experiencia_ilp || cuidador.experiencia_ilp || '',
        outros_cursos: result.outros_cursos || cuidador.outros_cursos_experiencias || '',
        referencias: result.referencias || cuidador.referencias || '',
        disponibilidade: result.disponibilidade || cuidador.disponibilidade || '',
        turno: result.turno || cuidador.turno || '',
      })
      setPhase('review')
      toast.success('Dados extraídos do currículo com sucesso! Revise antes de confirmar.')
    } catch (err) {
      const msg = 'Erro de comunicação ao extrair currículo.'
      setErrorMsg(msg)
      setPhase('idle')
      toast.error(msg)
    }
  }

  const handleConfirmSave = async () => {
    if (!cuidador?.id) return

    setPhase('saving')
    try {
      const patchData: Record<string, unknown> = {}

      if (data.nome.trim()) patchData.nome = data.nome.trim()
      if (data.email.trim()) patchData.email = data.email.trim()
      if (data.telefone.trim()) patchData.telefone = data.telefone.trim()
      if (data.cpf.trim()) patchData.cpf = data.cpf.replace(/[^\d]/g, '')
      if (data.endereco.trim()) patchData.endereco = data.endereco.trim()
      if (data.bairro.trim()) patchData.bairro = data.bairro.trim()
      if (data.cidade.trim()) patchData.cidade = data.cidade.trim()
      if (data.uf.trim()) patchData.uf = data.uf.trim().toUpperCase().slice(0, 2)
      if (data.formacao.trim()) patchData.formacao = data.formacao.trim()
      if (data.curso_cuidador.trim()) patchData.curso_cuidador = data.curso_cuidador.trim()
      if (data.tempo_experiencia.trim()) {
        patchData.tempo_experiencia = data.tempo_experiencia.trim()
        patchData.experiencia = data.tempo_experiencia.trim()
      }
      if (data.experiencia_ilp.trim()) patchData.experiencia_ilp = data.experiencia_ilp.trim()
      if (data.outros_cursos.trim())
        patchData.outros_cursos_experiencias = data.outros_cursos.trim()
      if (data.referencias.trim()) patchData.referencias = data.referencias.trim()

      if (data.disponibilidade.trim()) {
        const dLow = data.disponibilidade.toLowerCase()
        patchData.disponibilidade = dLow.includes('indispon') ? 'indisponível' : 'disponível'
      }

      if (data.turno.trim()) {
        const tLow = data.turno.toLowerCase()
        patchData.turno = tLow.includes('24') ? '24h' : '12h'
      }

      const cidadeLoc = data.cidade.trim() || cuidador.cidade || ''
      const ufLoc = data.uf.trim() || cuidador.uf || ''
      if (cidadeLoc || ufLoc) {
        patchData.localizacao = [cidadeLoc, ufLoc].filter(Boolean).join('/')
      }

      if (data.data_nascimento.trim()) {
        const rawDn = data.data_nascimento.trim()
        const digits = rawDn.replace(/[^\d]/g, '')
        if (digits.length === 8) {
          patchData.nascimento = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
        } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDn)) {
          patchData.nascimento = rawDn.slice(0, 10)
        }
      }

      await updateCuidador(cuidador.id, patchData)

      if (onApplyToForm) {
        onApplyToForm(data)
      }

      toast.success('Cadastro atualizado com os dados do currículo!')
      onOpenChange(false)
      setPhase('idle')
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error('Erro ao atualizar cadastro da cuidadora.')
      setPhase('review')
    }
  }

  const setField = <K extends keyof ExtractedCurriculoData>(key: K, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const hasCurriculo = Boolean(
    cuidador?.curriculo ||
    (cuidador?.documentos_pdf &&
      (Array.isArray(cuidador.documentos_pdf)
        ? cuidador.documentos_pdf.length > 0
        : Boolean(cuidador.documentos_pdf))),
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setPhase('idle')
          setErrorMsg(null)
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#FAF9F5] border-neutral-200 p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-neutral-900 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            Extrair dados do currículo anexado
          </DialogTitle>
        </DialogHeader>

        {phase === 'loading' ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-300/40 text-neutral-900 animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-base font-semibold text-neutral-900">
              Analisando currículo com IA...
            </p>
            <p className="text-xs text-neutral-500 max-w-sm">
              Lendo o documento anexado de {cuidador?.nome || 'cuidadora'} e identificando os dados
              pessoais, formação e experiências.
            </p>
          </div>
        ) : phase === 'review' ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-3.5 text-xs text-neutral-800">
              <p className="font-semibold text-neutral-900 mb-0.5">
                Revise os dados extraídos antes de confirmar
              </p>
              <p className="text-neutral-600">
                Os dados foram pré-preenchidos pela inteligência artificial a partir do currículo.
                Você pode editar qualquer campo abaixo antes de salvar. Nada é gravado sem sua
                confirmação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="sm:col-span-2">
                <Label htmlFor="edc-nome" className="text-xs font-semibold text-neutral-700">
                  Nome Completo
                </Label>
                <Input
                  id="edc-nome"
                  value={data.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-email" className="text-xs font-semibold text-neutral-700">
                  E-mail
                </Label>
                <Input
                  id="edc-email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-telefone" className="text-xs font-semibold text-neutral-700">
                  Telefone / Celular
                </Label>
                <Input
                  id="edc-telefone"
                  value={data.telefone}
                  onChange={(e) => setField('telefone', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-cpf" className="text-xs font-semibold text-neutral-700">
                  CPF
                </Label>
                <Input
                  id="edc-cpf"
                  value={data.cpf}
                  onChange={(e) => setField('cpf', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-nasc" className="text-xs font-semibold text-neutral-700">
                  Data de Nascimento
                </Label>
                <Input
                  id="edc-nasc"
                  value={data.data_nascimento}
                  placeholder="DD/MM/AAAA"
                  onChange={(e) => setField('data_nascimento', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="edc-endereco" className="text-xs font-semibold text-neutral-700">
                  Endereço
                </Label>
                <Input
                  id="edc-endereco"
                  value={data.endereco}
                  onChange={(e) => setField('endereco', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-bairro" className="text-xs font-semibold text-neutral-700">
                  Bairro
                </Label>
                <Input
                  id="edc-bairro"
                  value={data.bairro}
                  onChange={(e) => setField('bairro', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label htmlFor="edc-cidade" className="text-xs font-semibold text-neutral-700">
                    Cidade
                  </Label>
                  <Input
                    id="edc-cidade"
                    value={data.cidade}
                    onChange={(e) => setField('cidade', e.target.value)}
                    className="rounded-xl border-neutral-300 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-uf" className="text-xs font-semibold text-neutral-700">
                    UF
                  </Label>
                  <Input
                    id="edc-uf"
                    value={data.uf}
                    maxLength={2}
                    onChange={(e) => setField('uf', e.target.value.toUpperCase())}
                    className="rounded-xl border-neutral-300 bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="edc-formacao" className="text-xs font-semibold text-neutral-700">
                  Formação / Escolaridade
                </Label>
                <Input
                  id="edc-formacao"
                  value={data.formacao}
                  onChange={(e) => setField('formacao', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="edc-curso" className="text-xs font-semibold text-neutral-700">
                  Curso de Cuidador
                </Label>
                <Input
                  id="edc-curso"
                  value={data.curso_cuidador}
                  onChange={(e) => setField('curso_cuidador', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-tempo" className="text-xs font-semibold text-neutral-700">
                  Tempo de Experiência
                </Label>
                <Input
                  id="edc-tempo"
                  value={data.tempo_experiencia}
                  placeholder="Ex: 5 anos"
                  onChange={(e) => setField('tempo_experiencia', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-ilp" className="text-xs font-semibold text-neutral-700">
                  Experiência ILP / ILPI
                </Label>
                <Input
                  id="edc-ilp"
                  value={data.experiencia_ilp}
                  placeholder="Sim / Não"
                  onChange={(e) => setField('experiencia_ilp', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-disp" className="text-xs font-semibold text-neutral-700">
                  Disponibilidade
                </Label>
                <Input
                  id="edc-disp"
                  value={data.disponibilidade}
                  placeholder="disponível / indisponível"
                  onChange={(e) => setField('disponibilidade', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="edc-turno" className="text-xs font-semibold text-neutral-700">
                  Turno
                </Label>
                <Input
                  id="edc-turno"
                  value={data.turno}
                  placeholder="12h / 24h"
                  onChange={(e) => setField('turno', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="edc-outros" className="text-xs font-semibold text-neutral-700">
                  Outros Cursos e Experiências
                </Label>
                <Textarea
                  id="edc-outros"
                  rows={2}
                  value={data.outros_cursos}
                  onChange={(e) => setField('outros_cursos', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="edc-refs" className="text-xs font-semibold text-neutral-700">
                  Referências
                </Label>
                <Textarea
                  id="edc-refs"
                  rows={2}
                  value={data.referencias}
                  onChange={(e) => setField('referencias', e.target.value)}
                  className="rounded-xl border-neutral-300 bg-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">
                    {cuidador?.nome || 'Cuidadora'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {hasCurriculo
                      ? 'Currículo anexado pronto para extração'
                      : 'Nenhum currículo em PDF anexado neste cadastro'}
                  </p>
                </div>
              </div>

              {!hasCurriculo && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <p>
                    Esta cuidadora ainda não possui currículo anexado. Faça o upload do arquivo no
                    formulário ou importe via PDF antes de extrair.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-neutral-100/70 p-4 text-xs text-neutral-600 space-y-1.5">
              <p className="font-semibold text-neutral-800">Como funciona:</p>
              <p>• O agente de IA lê o currículo em PDF já anexado ao cadastro da cuidadora.</p>
              <p>• Extrai nome, contato, endereço, formação, cursos, referências e turnos.</p>
              <p>
                • Os dados são exibidos pré-preenchidos para sua revisão — nada é salvo sem a sua
                confirmação.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-3 pt-3">
          {phase === 'review' || phase === 'saving' ? (
            <>
              <Button
                variant="outline"
                disabled={phase === 'saving'}
                onClick={() => setPhase('idle')}
                className="rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmSave}
                disabled={phase === 'saving'}
                className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
              >
                {phase === 'saving' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-amber-300" /> Confirmar e salvar
                    dados
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              >
                Fechar
              </Button>
              <Button
                onClick={handleStartExtraction}
                disabled={!hasCurriculo || phase === 'loading'}
                className="rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
              >
                {phase === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extraindo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 text-amber-300" /> Extrair dados do currículo
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
