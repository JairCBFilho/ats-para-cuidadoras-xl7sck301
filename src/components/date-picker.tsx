import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string // ISO date string (YYYY-MM-DD)
  onChange: (iso: string) => void
  placeholder?: string
  id?: string
}

/**
 * Datepicker que armazena datas no formato ISO (YYYY-MM-DD).
 * Recebe e devolve strings ISO para compatibilidade com o PocketBase (date field).
 */
export function DatePicker({ value, onChange, placeholder = 'Selecione', id }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  // Converte string ISO -> Date
  const selected = (() => {
    if (!value) return undefined
    try {
      const d = parseISO(value)
      return isValid(d) ? d : undefined
    } catch {
      return undefined
    }
  })()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'dd/MM/yyyy', { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, 'yyyy-MM-dd'))
            }
            setOpen(false)
          }}
          locale={ptBR}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
