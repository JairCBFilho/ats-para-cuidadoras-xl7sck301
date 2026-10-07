import { useMemo } from 'react'
import { FileText, Download, ExternalLink, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import type { Cuidador } from '@/services/cuidadores'

interface Props {
  cuidador: Cuidador | null
  className?: string
}

export function DocumentosPdfList({ cuidador, className }: Props) {
  const filenames = useMemo(() => {
    if (!cuidador || !cuidador.documentos_pdf) return []
    if (Array.isArray(cuidador.documentos_pdf)) {
      return cuidador.documentos_pdf.filter(Boolean) as string[]
    }
    if (typeof cuidador.documentos_pdf === 'string' && cuidador.documentos_pdf.trim()) {
      return [cuidador.documentos_pdf]
    }
    return []
  }, [cuidador])

  if (filenames.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Nenhum documento anexado.</p>
  }

  const getUrl = (filename: string) => {
    return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/cuidadores/${cuidador?.id}/${filename}?token=${pb.authStore.token || ''}`
  }

  return (
    <div className={className || 'space-y-2'}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
        <Paperclip className="h-3.5 w-3.5" />
        <span>Documentos Anexados ({filenames.length})</span>
      </div>
      <div className="space-y-1.5">
        {filenames.map((filename, idx) => {
          const fileUrl = getUrl(filename)
          // Tenta extrair um nome mais amigável se contiver o hash gerado pelo PocketBase
          const displayName = filename.length > 25 ? `${filename.slice(0, 22)}...pdf` : filename

          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 p-2 px-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-red-500 shrink-0" />
                <span
                  className="font-medium truncate max-w-[200px] sm:max-w-[280px]"
                  title={filename}
                >
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-primary hover:bg-primary/10 transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Ver</span>
                </a>
                <a
                  href={fileUrl}
                  download={filename}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                  <span>Baixar</span>
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
