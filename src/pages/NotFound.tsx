import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Página não encontrada</p>
        <Link to="/" className="text-primary hover:underline">
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}

export default NotFound
