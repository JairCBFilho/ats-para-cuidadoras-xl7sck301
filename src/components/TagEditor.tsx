import { useState, useMemo } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SUGGESTED_TAGS, parseTags, stringifyTags } from '@/services/cuidadores'
import { cn } from '@/lib/utils'

interface Props {
  tags: string | undefined
  onChange: (tags: string) => void
  disabled?: boolean
}

/** Varia cores para os badges de tag conforme o índice */
const TAG_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200',
]

export function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % TAG_COLORS.length
  return TAG_COLORS[h]
}

/** Lista de tags pequenas e coloridas para exibição em cards */
export function TagBadges({ tags }: { tags?: string }) {
  const list = parseTags(tags)
  if (list.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((t) => (
        <span
          key={t}
          className={cn(
            'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
            tagColor(t),
          )}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

export function TagEditor({ tags, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const list = useMemo(() => parseTags(tags), [tags])

  const addTag = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    if (list.some((x) => x.toLowerCase() === t.toLowerCase())) return
    onChange(stringifyTags([...list, t]))
  }

  const removeTag = (t: string) => {
    onChange(stringifyTags(list.filter((x) => x !== t)))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(draft)
      setDraft('')
    }
  }

  const suggestions = SUGGESTED_TAGS.filter(
    (s) => !list.some((x) => x.toLowerCase() === s.toLowerCase()),
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={disabled}
          title="Editar tags"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">Tags do cuidador</p>

          {/* Tags atuais */}
          {list.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {list.map((t) => (
                <Badge key={t} variant="secondary" className={cn('gap-1 pr-1', tagColor(t))}>
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-0.5 rounded-full hover:bg-black/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhuma tag ainda.</p>
          )}

          {/* Nova tag */}
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Nova tag + Enter"
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-2"
              onClick={() => {
                addTag(draft)
                setDraft('')
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Sugestões</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className="inline-flex items-center rounded-md border border-dashed border-input px-1.5 py-0.5 text-[10px] font-medium hover:bg-accent"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
