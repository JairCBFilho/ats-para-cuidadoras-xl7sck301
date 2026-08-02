import pb from '@/lib/pocketbase/client'

export interface Configuracoes {
  id: string
  canal_manual: 'email' | 'whatsapp'
  created: string
  updated: string
}

export const getConfiguracoes = async (): Promise<Configuracoes | null> => {
  try {
    const records = await pb
      .collection('configuracoes')
      .getFullList<Configuracoes>({ sort: 'created' })
    return records[0] || null
  } catch {
    return null
  }
}

export const updateConfiguracoes = (id: string, data: Partial<Configuracoes>) =>
  pb.collection('configuracoes').update<Configuracoes>(id, data)

export const createConfiguracoes = (data: Partial<Configuracoes>) =>
  pb.collection('configuracoes').create<Configuracoes>(data)
