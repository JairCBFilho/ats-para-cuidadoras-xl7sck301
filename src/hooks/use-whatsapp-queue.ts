import { useState, useRef, useCallback } from 'react'
import type { BulkSendResult } from '@/services/bulk-send'

export type ItemStatus = 'pendente' | 'enviada' | 'pulada'
export type QueueState = 'idle' | 'processing' | 'completed'

export interface WhatsAppQueueItem {
  id: string
  nome: string
  telefone: string
  link: string
  status: ItemStatus
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
  start: (links: BulkSendResult[]) => void
  openCurrent: () => void
  next: () => void
  skip: () => void
  goTo: (index: number) => void
  cancel: () => void
  reset: () => void
}

const TAB_NAME = 'whatsapp-envio'

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
  const [popupBlocked, setPopupBlocked] = useState(false)

  const itemsRef = useRef<WhatsAppQueueItem[]>([])
  itemsRef.current = items

  const start = useCallback((rawLinks: BulkSendResult[]) => {
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
    setPopupBlocked(false)

    if (newItems.length > 0) {
      setQueueState('processing')
    } else {
      setQueueState('completed')
    }
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
      return
    }

    // Marca item atual como 'enviada' se ainda estava pendente ou pulada
    setItems((prev) =>
      prev.map((item, idx) => (idx === currentIndex ? { ...item, status: 'enviada' } : item)),
    )

    const nextIndex = currentIndex + 1
    if (nextIndex >= list.length) {
      setQueueState('completed')
      return
    }

    setCurrentIndex(nextIndex)
    // Automaticamente navega a mesma aba nomeada para a próxima cuidadora
    const nextItem = list[nextIndex]
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
  }, [currentIndex])

  /** Usuário pula a cuidadora atual -> marca como 'pulada' e avança */
  const skip = useCallback(() => {
    setPopupBlocked(false)
    const list = itemsRef.current
    if (currentIndex >= list.length) {
      setQueueState('completed')
      return
    }

    setItems((prev) =>
      prev.map((item, idx) => (idx === currentIndex ? { ...item, status: 'pulada' } : item)),
    )

    const nextIndex = currentIndex + 1
    if (nextIndex >= list.length) {
      setQueueState('completed')
      return
    }

    setCurrentIndex(nextIndex)
  }, [currentIndex])

  /** Permite saltar ou retomar de onde parou */
  const goTo = useCallback((targetIndex: number) => {
    const list = itemsRef.current
    if (targetIndex < 0 || targetIndex >= list.length) return
    setCurrentIndex(targetIndex)
    setPopupBlocked(false)
    setQueueState('processing')
  }, [])

  const cancel = useCallback(() => {
    setPopupBlocked(false)
    setQueueState('completed')
  }, [])

  const reset = useCallback(() => {
    setQueueState('idle')
    setCurrentIndex(0)
    setItems([])
    itemsRef.current = []
    setPopupBlocked(false)
  }, [])

  const enviadasCount = items.filter((i) => i.status === 'enviada').length
  const puladasCount = items.filter((i) => i.status === 'pulada').length
  const pendentesCount = items.filter((i) => i.status === 'pendente').length
  const currentItem = items[currentIndex] || null

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
    start,
    openCurrent,
    next,
    skip,
    goTo,
    cancel,
    reset,
  }
}
