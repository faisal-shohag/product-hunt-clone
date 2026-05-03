import { Link, useNavigate } from 'react-router-dom'
import { Rocket, Search, CirclePlus as PlusCircle, LayoutDashboard, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModeToggle } from '@/components/mode-toggle'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mr-4">
          <Rocket className="size-5 text-primary" />
          <span className="hidden sm:inline">LaunchPad</span>
        </Link>

        {/* Search placeholder */}
        <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 rounded-md border bg-muted/40 px-3 h-9 text-sm text-muted-foreground cursor-pointer hover:bg-muted/60 transition-colors">
          <Search className="size-4" />
          <span>Search products…</span>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {!profile?.is_maker && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/become-maker">Become Maker</Link>
                </Button>
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link to="/submit">
                  <PlusCircle className="size-4" />
                  <span className="hidden sm:inline">Submit</span>
                </Link>
              </Button>

              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">
                    <LayoutDashboard className="size-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar size="sm">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user.id}`}>
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <LayoutDashboard className="size-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}
