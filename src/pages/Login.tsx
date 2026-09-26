import { useState, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import lazuliLogo from '@/assets/simbolo-lazuli-cmyk-fundo-azul-f722e.jpg'

export default function Login() {
  const { signIn, requestPasswordReset, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) return <Navigate to="/" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou senha inválidos')
      setSubmitting(false)
    } else {
      navigate('/')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Por favor, informe seu email')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    const { error } = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (error) {
      // Como boa prática de segurança e usabilidade, avisamos o usuário
      setSuccessMessage(
        'Se o email existir em nossa base, você receberá um link de redefinição de senha.',
      )
    } else {
      setSuccessMessage('Se o email existir, você receberá um link de redefinição de senha.')
    }
  }

  const switchMode = (newMode: 'login' | 'forgot-password') => {
    setMode(newMode)
    setError('')
    setSuccessMessage('')
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
            <CardTitle>{mode === 'login' ? 'Entrar' : 'Recuperar senha'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Acesse sua conta para gerenciar candidatas'
                : 'Digite seu email para receber um link de redefinição de senha'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Esqueci minha senha?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                O acesso ao sistema é por convite. Precisa de acesso? Fale com o administrador.
              </p>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {successMessage && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  {successMessage}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando link...' : 'Enviar link de recuperação'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Voltar para o login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
