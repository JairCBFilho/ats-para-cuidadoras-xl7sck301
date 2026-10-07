import { useState, useRef, useCallback } from 'react'
import type { BulkSendResult } from '@/services/bulk-send'

export type ItemStatus = 'pendente' | 'enviada' | 'pulada'
export type QueueState = 'idle' | 'processing' | 'completed'

export interface WhatsAppQueueContext {
  origem?: string // ex: 'bulk-send' | 'comunicacao-por-tag'
  tag?: string
  canal?: string
  templateId?: string
  etapa?: string
  vagaId?: string
  timestamp?: number
}

export interface WhatsAppQueueItem {
  id: string
  nome: string
  telefone: string
  link: string
  status: ItemStatus
}

export interface PersistedQueueData {
  items: WhatsAppQueueItem[]
  currentIndex: number
  queueState: QueueState
  context?: WhatsAppQueueContext
  savedAt: number
}

export interface WhatsAppQueue {
  queueState: QueueState
  currentIndex: number
  items: WhatsAppQueueItem[]
  totalLinks: number
  enviadasCount: number
  puladasCount: number
  pendentesCount: number
  currentItem: WhatsAppQueueItem | null
  popupBlocked: boolean
  context?: WhatsAppQueueContext
  hasSavedQueue: boolean
  savedQueueData: PersistedQueueData | null
  start: (links: BulkSendResult[], context?: WhatsAppQueueContext) => void
  resumeSavedQueue: () => void
  discardSavedQueue: () => void
  openCurrent: () => void
  next: () => void
  skip: () => void
  goTo: (index: number) => void
  cancel: () => void
  reset: () => void
}

const TAB_NAME = 'whatsapp-envio'
const STORAGE_KEY = 'lazuli_whatsapp_queue_v1'

function loadFromStorage(): PersistedQueueData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedQueueData
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function saveToStorage(data: PersistedQueueData | null) {
  try {
    if (!data) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch {
    /* ignore storage full or private mode */
  }
}

/** Garante que o link use web.whatsapp.com/send com DDI 55 */
export function normalizeWhatsAppWebLink(link: string): string {
  if (!link) return ''
  // Se já for web.whatsapp.com/send, mantemos e garantimos formato
  if (link.includes('web.whatsapp.com/send')) {
    return link
  }
  // Se for wa.me/XXXXX?text=YYYY ou api.whatsapp.com/send?phone=...
  try {
    const url = new URL(link)
    let phone = ''
    let text = ''

    if (url.hostname.includes('wa.me')) {
      phone = url.pathname.replace(/^\/+/, '').replace(/[^\d]/g, '')
      text = url.searchParams.get('text') || ''
    } else {
      phone = (url.searchParams.get('phone') || '').replace(/[^\d]/g, '')
      text = url.searchParams.get('text') || ''
    }

    if (phone.length === 10 || phone.length === 11) {
      phone = '55' + phone
    }

    return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
  } catch {
    return link
  }
}

export function useWhatsappQueue(): WhatsAppQueue {
  const [queueState, setQueueState] = useState<QueueState>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [items, setItems] = useState<WhatsAppQueueItem[]>([])
  const [context, setContext] = useState<WhatsAppQueueContext | undefined>(undefined)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [savedQueueData, setSavedQueueData] = useState<PersistedQueueData | null>(() =>
    loadFromStorage(),
  )

  const itemsRef = useRef<WhatsAppQueueItem[]>([])
  itemsRef.current = items

  // Atualiza estado salvo no storage sempre que itens / índice / estado mudam (durante o processamento)
  const persistState = useCallback(
    (
      newItems: WhatsAppQueueItem[],
      newIndex: number,
      newState: QueueState,
      newCtx?: WhatsAppQueueContext,
    ) => {
      if (newState === 'processing') {
        const payload: PersistedQueueData = {
          items: newItems,
          currentIndex: newIndex,
          queueState: newState,
          context: newCtx,
          savedAt: Date.now(),
        }
        saveToStorage(payload)
        setSavedQueueData(payload)
      } else if (newState === 'completed' || newState === 'idle') {
        saveToStorage(null)
        setSavedQueueData(null)
      }
    },
    [],
  )

  const start = useCallback(
    (rawLinks: BulkSendResult[], ctx?: WhatsAppQueueContext) => {
      const newItems: WhatsAppQueueItem[] = rawLinks
        .filter((r) => r.success && r.link)
        .map((r, idx) => ({
          id: r.candidataId || `item-${idx}`,
          nome: r.nome || `Cuidadora #${idx + 1}`,
          telefone: r.telefone || '',
          link: normalizeWhatsAppWebLink(r.link || ''),
          status: 'pendente' as ItemStatus,
        }))

      setItems(newItems)
      itemsRef.current = newItems
      setCurrentIndex(0)
      setContext(ctx)
      setPopupBlocked(false)

      const newState: QueueState = newItems.length > 0 ? 'processing' : 'completed'
      setQueueState(newState)
      persistState(newItems, 0, newState, ctx)
    },
    [persistState],
  )

  /** Retoma a fila salva no localStorage */
  const resumeSavedQueue = useCallback(() => {
    const saved = loadFromStorage()
    if (!saved || saved.items.length === 0) return
    setItems(saved.items)
    itemsRef.current = saved.items
    setCurrentIndex(saved.currentIndex)
    setContext(saved.context)
    setQueueState('processing')
    setPopupBlocked(false)
  }, [])

  /** Descarta a fila salva no localStorage */
  const discardSavedQueue = useCallback(() => {
    saveToStorage(null)
    setSavedQueueData(null)
  }, [])

  /** Abre a aba única nomeada com o link atual */
  const openCurrent = useCallback(() => {
    const list = itemsRef.current
    if (currentIndex >= list.length) return
    const current = list[currentIndex]
    if (!current?.link) return

    setPopupBlocked(false)
    const win = window.open(current.link, TAB_NAME)
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setPopupBlocked(true)
      return
    }

    try {
      win.focus()
    } catch {
      /* ignore cross-window focus error */
    }
  }, [currentIndex])

  /** Usuário confirma o envio ("Próxima") -> marca como enviada e avança */
  const next = useCallback(() => {
    setPopupBlocked(false)
    const list = itemsRef.current
    if (currentIndex >= list.length) {
      setQueueState('completed')
      persistState(list, currentIndex, 'completed', context)
      return
    }

    // Marca item atual como 'enviada' se ainda estava pendente ou pulada
    const updatedList = list.map((item, idx) =>
      idx === currentIndex ? { ...item, status: 'enviada' as ItemStatus } : item,
    )
    setItems(updatedList)
    itemsRef.current = updatedList

    const nextIndex = currentIndex + 1
    if (nextIndex >= updatedList.length) {
      setQueueState('completed')
      persistState(updatedList, nextIndex, 'completed', context)
      return
    }

    setCurrentIndex(nextIndex)
    persistState(updatedList, nextIndex, 'processing', context)

    // Automaticamente navega a mesma aba nomeada para a próxima cuidadora
    const nextItem = updatedList[nextIndex]
    if (nextItem?.link) {
      const win = window.open(nextItem.link, TAB_NAME)
      if (win) {
        try {
          win.focus()
        } catch {
          /* ignore */
        }
      }
    }
  }, [currentIndex, context, persistState])

  /** Usuário pula a cuidadora atual -> marca como 'pulada' e avança */
  const skip = useCallback(() => {
    setPopupBlocked(false)
    const list = itemsRef.current
    if (currentIndex >= list.length) {
      setQueueState('completed')
      persistState(list, currentIndex, 'completed', context)
      return
    }

    const updatedList = list.map((item, idx) =>
      idx === currentIndex ? { ...item, status: 'pulada' as ItemStatus } : item,
    )
    setItems(updatedList)
    itemsRef.current = updatedList

    const nextIndex = currentIndex + 1
    if (nextIndex >= updatedList.length) {
      setQueueState('completed')
      persistState(updatedList, nextIndex, 'completed', context)
      return
    }

    setCurrentIndex(nextIndex)
    persistState(updatedList, nextIndex, 'processing', context)
  }, [currentIndex, context, persistState])

  /** Permite saltar ou retomar de onde parou */
  const goTo = useCallback(
    (targetIndex: number) => {
      const list = itemsRef.current
      if (targetIndex < 0 || targetIndex >= list.length) return
      setCurrentIndex(targetIndex)
      setPopupBlocked(false)
      setQueueState('processing')
      persistState(list, targetIndex, 'processing', context)
    },
    [context, persistState],
  )

  const cancel = useCallback(() => {
    setPopupBlocked(false)
    setQueueState('completed')
    // Ao encerrar/concluir, limpa o storage
    saveToStorage(null)
    setSavedQueueData(null)
  }, [])

  const reset = useCallback(() => {
    setQueueState('idle')
    setCurrentIndex(0)
    setItems([])
    itemsRef.current = []
    setContext(undefined)
    setPopupBlocked(false)
    // Atualiza estado do storage conhecido
    setSavedQueueData(loadFromStorage())
  }, [])

  const enviadasCount = items.filter((i) => i.status === 'enviada').length
  const puladasCount = items.filter((i) => i.status === 'pulada').length
  const pendentesCount = items.filter((i) => i.status === 'pendente').length
  const currentItem = items[currentIndex] || null
  const hasSavedQueue = Boolean(
    savedQueueData && savedQueueData.items && savedQueueData.items.length > 0,
  )

  return {
    queueState,
    currentIndex,
    items,
    totalLinks: items.length,
    enviadasCount,
    puladasCount,
    pendentesCount,
    currentItem,
    popupBlocked,
    context,
    hasSavedQueue,
    savedQueueData,
    start,
    resumeSavedQueue,
    discardSavedQueue,
    openCurrent,
    next,
    skip,
    goTo,
    cancel,
    reset,
  }
}
