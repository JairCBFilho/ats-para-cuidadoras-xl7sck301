import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Vagas from '@/pages/Vagas'
import Candidatas from '@/pages/Candidatas'
import Funil from '@/pages/Funil'
import Relatorios from '@/pages/Relatorios'
import CandidataProfile from '@/pages/CandidataProfile'
import Configuracoes from '@/pages/Configuracoes'
import Dashboard from '@/pages/Dashboard'
import Entrevistas from '@/pages/Entrevistas'
import BancoTalentos from '@/pages/BancoTalentos'
import ComunicacaoPorTag from '@/pages/ComunicacaoPorTag'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import NotFound from '@/pages/NotFound'
import Cadastro from '@/pages/Cadastro'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/vagas" element={<Vagas />} />
              <Route path="/candidatas" element={<Candidatas />} />
              <Route path="/candidatas/:id" element={<CandidataProfile />} />
              <Route path="/funil" element={<Funil />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/entrevistas" element={<Entrevistas />} />
              <Route path="/banco-talentos" element={<BancoTalentos />} />
              <Route path="/comunicacao-tag" element={<ComunicacaoPorTag />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
