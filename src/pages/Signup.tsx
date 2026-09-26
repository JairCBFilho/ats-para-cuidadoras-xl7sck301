import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react'
import lazuliLogo from '@/assets/simbolo-lazuli-cmyk-fundo-azul-f722e.jpg'

type InviteState = 'checking' | 'valid' | 'invalid'

export default function Signup() {
  const { signIn, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [invite, setInvite] = useState<InviteState>(token ? 'checking' : 'invalid')
  const [inviteEmail, setInviteEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(
      `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/convites/validar?token=${encodeURIComponent(token)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setInvite(d?.valid ? 'valid' : 'invalid')
        if (d?.email) setInviteEmail(d.email)
      })
      .catch(() => {
        if (!cancelled) setInvite('invalid')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  if (!loading && isAuthenticated) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      setSubmitting(false)
      return
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/convites/confirmar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, name, password }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Erro ao criar conta. Tente novamente.')
        setSubmitting(false)
        return
      }
      // Auto-login com o e-mail do convite
      const { error: signInError } = await signIn(inviteEmail || data?.email, password)
      if (signInError) {
        // Conta criada — manda para o login
        navigate('/login')
        return
      }
      navigate('/')
    } catch {
      setError('Erro de comunicação com o servidor')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={lazuliLogo}
              alt="Lazuli Logo"
              className="h-9 w-9 rounded-full object-cover shadow-sm"
            />
            <span className="text-xl font-bold">Lazuli ATS</span>
          </div>
          <div>
            <CardTitle>Criar Conta</CardTitle>
            <CardDescription>O acesso é por convite. Verificando seu convite...</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {invite === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validando convite...</p>
            </div>
          )}

          {invite === 'invalid' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <ShieldAlert className="h-7 w-7 text-red-500" />
              </div>
              <p className="font-medium">Convite inválido ou expirado</p>
              <p className="text-sm text-muted-foreground">
                Este link não é mais válido. Solicite um novo convite ao administrador.
              </p>
              <Button variant="outline" asChild className="mt-2">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          )}

          {invite === 'valid' && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail do convite</Label>
                <Input id="email" type="email" value={inviteEmail} disabled />
                <p className="mt-1 text-xs text-muted-foreground">
                  A conta será criada com este e-mail.
                </p>
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Criar Conta
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Já tem conta?{' '}
                <Link to="/login" className="text-primary font-medium underline">
                  Entrar
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
