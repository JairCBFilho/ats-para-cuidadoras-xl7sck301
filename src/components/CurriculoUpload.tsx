import { useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFileUrl } from '@/hooks/use-file-url'

interface Props {
  record: { id: string; collectionName?: string } | null
  curriculo?: string
  onChange: (file: File | null) => void
}

export function CurriculoUpload({ record, curriculo, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const currentUrl = useFileUrl(curriculo ? record : null, curriculo)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são aceitos.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 10 MB.')
      return
    }
    setError('')
    setFileName(file.name)
    onChange(file)
  }

  const handleRemove = () => {
    setFileName(null)
    setError('')
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex items-center gap-3">
        {fileName || currentUrl ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{fileName || 'curriculo.pdf'}</span>
            {currentUrl && !fileName && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Abrir
              </a>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <X className="mr-1 h-3.5 w-3.5" /> Remover
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" /> Enviar currículo (PDF)
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
