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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vagas', label: 'Vagas', icon: Briefcase },
  { to: '/candidatas', label: 'Candidatas', icon: Users },
  { to: '/funil', label: 'Funil', icon: KanbanSquare },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  return (
    <nav className="flex-1 space-y-1 px-3">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            location.pathname === item.to
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
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
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:block w-64 shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 border-b px-4 py-3 bg-background">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold">CuidarATS</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
