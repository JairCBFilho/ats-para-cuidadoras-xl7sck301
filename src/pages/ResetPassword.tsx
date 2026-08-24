import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import lazuliLogo from '@/assets/simbolo-lazuli-cmyk-fundo-azul-f722e.jpg'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { confirmPasswordReset } = useAuth()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Link inválido ou expirado. Por favor, solicite uma nova redefinição.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Token de recuperação não encontrado ou inválido.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    setError('')

    const { success, error } = await confirmPasswordReset(token, password, passwordConfirm)
    setSubmitting(false)

    if (!success || error) {
      const errMsg =
        error?.message || 'Erro ao redefinir a senha. O link pode ter expirado ou ser inválido.'
      setError(errMsg)
    } else {
      setSuccess(true)
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
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>
              {success
                ? 'Sua senha foi alterada com sucesso'
                : 'Crie uma nova senha de acesso para sua conta'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  Link inválido ou expirado. Verifique o link recebido ou solicite uma nova
                  redefinição.
                </span>
              </div>
              <Button asChild className="w-full">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Senha redefinida com sucesso!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Você já pode acessar sua conta utilizando a nova senha cadastrada.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/login">Ir para o login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passwordConfirm">Confirmar nova senha</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Redefinindo senha...' : 'Redefinir senha'}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline font-medium">
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
