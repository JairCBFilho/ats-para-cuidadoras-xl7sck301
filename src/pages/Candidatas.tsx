import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, User, Trash2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getCandidatas,
  createCandidata,
  updateCandidata,
  deleteCandidata,
  type Candidata,
} from '@/services/candidatas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('required') || m.includes('missing') || m.includes('blank'))
    return 'Este campo é obrigatório.'
  if (m.includes('email')) return 'Informe um e-mail válido.'
  return msg
}

export default function Candidatas() {
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Candidata | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    formacao: '',
    localizacao: '',
    experiencia: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      const data = await getCandidatas()
      setCandidatas(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('candidatas', () => {
    loadData()
  })

  const openCreate = () => {
    setEditing(null)
    setFormData({ nome: '', email: '', formacao: '', localizacao: '', experiencia: '' })
    setFieldErrors({})
    setDialogOpen(true)
  }

  const openEdit = (c: Candidata) => {
    setEditing(c)
    setFormData({
      nome: c.nome,
      email: c.email,
      formacao: c.formacao || '',
      localizacao: c.localizacao || '',
      experiencia: c.experiencia || '',
    })
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      if (editing) {
        await updateCandidata(editing.id, formData)
        toast.success('Candidata atualizada com sucesso!')
      } else {
        await createCandidata(formData)
        toast.success('Candidata criada com sucesso!')
      }
      setDialogOpen(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta candidata?')) return
    try {
      await deleteCandidata(id)
      toast.success('Candidata excluída com sucesso!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidatas</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova Candidata
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Formação</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : candidatas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma candidata cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                candidatas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.formacao || '-'}</TableCell>
                    <TableCell>{c.localizacao || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/candidatas/${c.id}`}>
                            <User className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Candidata' : 'Nova Candidata'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
              {fieldErrors.nome && (
                <p className="text-sm text-red-500">{translateError(fieldErrors.nome)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500">{translateError(fieldErrors.email)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="formacao">Formação</Label>
              <Input
                id="formacao"
                value={formData.formacao}
                onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experiencia">Experiência</Label>
              <Input
                id="experiencia"
                value={formData.experiencia}
                onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
