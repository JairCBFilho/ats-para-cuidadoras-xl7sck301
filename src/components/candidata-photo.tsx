import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useFileUrl } from '@/hooks/use-file-url'
import type { Candidata } from '@/services/candidatas'

interface Props {
  candidata: Candidata
  className?: string
}

export function CandidataPhoto({ candidata, className }: Props) {
  const photoUrl = useFileUrl(candidata, candidata.foto)
  return (
    <Avatar className={className}>
      {photoUrl && <AvatarImage src={photoUrl} alt={candidata.nome} />}
      <AvatarFallback>{candidata.nome?.[0]?.toUpperCase() || '?'}</AvatarFallback>
    </Avatar>
  )
}
