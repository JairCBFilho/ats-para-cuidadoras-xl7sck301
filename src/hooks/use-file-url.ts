import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'

export function useFileUrl(
  record: { id: string; collectionName?: string } | null,
  filename: string | undefined,
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!filename || !record) {
      setUrl(null)
      return
    }

    let cancelled = false
    let objUrl: string | null = null

    const collectionName =
      ((record as Record<string, unknown>).collectionName as string) || 'candidatas'
    const baseUrl = `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${collectionName}/${record.id}/${filename}`

    fetch(baseUrl, {
      headers: { Authorization: pb.authStore.token },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return
        objUrl = URL.createObjectURL(blob)
        setUrl(objUrl)
      })
      .catch(() => setUrl(null))

    return () => {
      cancelled = true
      if (objUrl) URL.revokeObjectURL(objUrl)
    }
  }, [record?.id, filename])

  return url
}
