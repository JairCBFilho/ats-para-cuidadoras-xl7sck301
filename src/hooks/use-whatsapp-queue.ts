import { useState, useRef, useCallback } from 'react'
import type { BulkSendResult } from '@/services/bulk-send'

const PAUSE_MS = 3000

export type QueueState = 'idle' | 'processing' | 'paused' | 'completed'

export interface WhatsAppQueue {
  queueState: QueueState
  currentIndex: number
  totalLinks: number
  openedCount: number
  popupBlocked: boolean
  start: (links: BulkSendResult[]) => void
  pause: () => void
  resume: () => void
  skip: () => void
  cancel: () => void
  manualOpen: () => void
  reset: () => void
}

export function useWhatsappQueue(): WhatsAppQueue {
  const [queueState, setQueueState] = useState<QueueState>('idle')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [openedCount, setOpenedCount] = useState(0)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const linksRef = useRef<BulkSendResult[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelRef = useRef(false)
  const pausedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const processNext = useCallback(
    (index: number) => {
      clearTimer()
      const results = linksRef.current
      if (cancelRef.current) return
      if (index >= results.length) {
        setQueueState('completed')
        return
      }
      setCurrentIndex(index)
      setPopupBlocked(false)
      const result = results[index]
      if (!result.link) {
        processNext(index + 1)
        return
      }
      const win = window.open(result.link, '_blank')
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setPopupBlocked(true)
        return
      }
      setOpenedCount((prev) => prev + 1)
      if (index + 1 >= results.length) {
        setQueueState('completed')
        return
      }
      timeoutRef.current = setTimeout(() => {
        if (cancelRef.current || pausedRef.current) return
        processNext(index + 1)
      }, PAUSE_MS)
    },
    [clearTimer],
  )

  const start = useCallback(
    (links: BulkSendResult[]) => {
      linksRef.current = links
      cancelRef.current = false
      pausedRef.current = false
      setOpenedCount(0)
      setCurrentIndex(0)
      setPopupBlocked(false)
      setQueueState('processing')
      processNext(0)
    },
    [processNext],
  )

  const pause = useCallback(() => {
    pausedRef.current = true
    setQueueState('paused')
    clearTimer()
  }, [clearTimer])

  const resume = useCallback(() => {
    clearTimer()
    pausedRef.current = false
    setQueueState('processing')
    const next = currentIndex + 1
    if (next >= linksRef.current.length) {
      setQueueState('completed')
      return
    }
    timeoutRef.current = setTimeout(() => {
      if (cancelRef.current || pausedRef.current) return
      processNext(next)
    }, PAUSE_MS)
  }, [clearTimer, currentIndex, processNext])

  const skip = useCallback(() => {
    clearTimer()
    setPopupBlocked(false)
    const next = currentIndex + 1
    if (next >= linksRef.current.length) {
      setQueueState('completed')
      return
    }
    processNext(next)
  }, [clearTimer, currentIndex, processNext])

  const cancel = useCallback(() => {
    clearTimer()
    cancelRef.current = true
    setQueueState('completed')
  }, [clearTimer])

  const manualOpen = useCallback(() => {
    const result = linksRef.current[currentIndex]
    if (!result?.link) return
    window.open(result.link, '_blank')
    setOpenedCount((prev) => prev + 1)
    setPopupBlocked(false)
    if (currentIndex + 1 >= linksRef.current.length) {
      setQueueState('completed')
      return
    }
    clearTimer()
    timeoutRef.current = setTimeout(() => {
      if (cancelRef.current || pausedRef.current) return
      processNext(currentIndex + 1)
    }, PAUSE_MS)
  }, [clearTimer, currentIndex, processNext])

  const reset = useCallback(() => {
    clearTimer()
    cancelRef.current = true
    pausedRef.current = false
    linksRef.current = []
    setQueueState('idle')
    setCurrentIndex(0)
    setOpenedCount(0)
    setPopupBlocked(false)
  }, [clearTimer])

  return {
    queueState,
    currentIndex,
    totalLinks: linksRef.current.length,
    openedCount,
    popupBlocked,
    start,
    pause,
    resume,
    skip,
    cancel,
    manualOpen,
    reset,
  }
}
