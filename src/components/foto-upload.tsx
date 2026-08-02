import { useRef, useState } from 'react'
import { Upload, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useFileUrl } from '@/hooks/use-file-url'

interface Props {
  record: { id: string; collectionName?: string } | null
  foto?: string
  onChange: (file: File | null) => void
}

export function FotoUpload({ record, foto, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const currentUrl = useFileUrl(foto ? record : null, foto)
  const displayUrl = preview || currentUrl

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Apenas JPG, PNG e WebP são aceitos.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5 MB.')
      return
    }
    setError('')
    setPreview(URL.createObjectURL(file))
    onChange(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setError('')
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {displayUrl && <AvatarImage src={displayUrl} alt="Foto" />}
          <AvatarFallback>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" /> Enviar foto
          </Button>
          {displayUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
              <X className="mr-2 h-4 w-4" /> Remover foto
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
