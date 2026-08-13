import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  KanbanSquare,
  Heart,
  Menu,
  LogOut,
  BarChart3,
  Settings,
  TrendingUp,
  Database,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { NotificationBell } from '@/components/NotificationBell'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/banco-talentos', label: 'Talentos', icon: Database },
  { to: '/vagas', label: 'Vagas', icon: Briefcase },
  { to: '/candidatas', label: 'Candidatas', icon: Users },
  { to: '/comunicacao-tag', label: 'Comunicação', icon: Megaphone },
  { to: '/funil', label: 'Funil', icon: KanbanSquare },
  { to: '/dashboard', label: 'Métricas', icon: TrendingUp },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  return (
    <nav className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/80 rounded-full border border-black/10 shadow-sm max-w-full overflow-x-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap',
              isActive
                ? 'bg-black text-white shadow-md scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-black/5',
            )}
          >
            <item.icon
              className={cn('h-3.5 w-3.5', isActive ? 'text-amber-400' : 'text-muted-foreground')}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => {
    signOut()
    navigate('/login')
  }
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2 px-6 py-6">
        <Heart className="h-8 w-8 text-primary" />
        <span className="text-lg font-bold">CuidarATS</span>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f5f2eb] to-[#e8e2d5] text-foreground font-sans p-4 md:p-6 flex flex-col antialiased">
      {/* Container estilo "App / Soft Window" do Crextio */}
      <div className="flex-1 flex flex-col bg-[#f7f5ee]/90 backdrop-blur-md rounded-[2.5rem] border border-white/80 shadow-2xl overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Header estilo Crextio com Pill Nav */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-white/40 backdrop-blur-sm gap-4 flex-wrap">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-amber-400 font-extrabold text-xl shadow-md border border-amber-400/20">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-black">
              Crextio{' '}
              <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-full text-black font-semibold">
                ATS
              </span>
            </span>
          </div>

          {/* Pill navigation bar central (Desktop) */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-4xl px-2">
            <NavLinks />
          </div>

          {/* User actions right */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-black/10">
              <Avatar className="h-9 w-9 border border-black/10 shadow-sm">
                <AvatarFallback className="bg-amber-400 text-black font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left leading-tight pr-1 hidden xl:block">
                <p className="text-xs font-bold text-black truncate max-w-[100px]">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-black hover:bg-black/5"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile menu trigger */}
            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 border-black/10"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 p-6 rounded-l-3xl border-l border-black/10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-amber-400 font-bold text-xl">
                        C
                      </div>
                      <span className="font-bold text-lg">Crextio ATS</span>
                    </div>
                    <div className="space-y-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                            location.pathname === item.to
                              ? 'bg-black text-white font-semibold'
                              : 'text-muted-foreground hover:bg-black/5 hover:text-foreground',
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-amber-400 text-black font-bold">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-black truncate max-w-[120px]">
                          {user?.name || 'Usuário'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="rounded-full"
                      >
                        <LogOut className="h-4 w-4 mr-1" /> Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar horizontally scrollable for tablet/mobile */}
        <div className="lg:hidden px-4 py-2 bg-white/30 border-b border-black/5 overflow-x-auto">
          <NavLinks />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
