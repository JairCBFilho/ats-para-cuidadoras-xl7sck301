import pb from '@/lib/pocketbase/client'

export interface CompatibilidadeResult {
  score: number
  justificativa: string
}

export const calcularCompatibilidade = (candidataId: string, vagaId: string) =>
  pb.send('/backend/v1/compatibilidade/calcular', {
    method: 'POST',
    body: JSON.stringify({ candidataId, vagaId }),
    headers: { 'Content-Type': 'application/json' },
  }) as Promise<CompatibilidadeResult>
