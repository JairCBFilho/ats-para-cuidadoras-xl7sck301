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
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/vagas" element={<Vagas />} />
              <Route path="/candidatas" element={<Candidatas />} />
              <Route path="/candidatas/:id" element={<CandidataProfile />} />
              <Route path="/funil" element={<Funil />} />
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
