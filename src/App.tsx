import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Submit from '@/pages/Submit'
import BecomeMaker from '@/pages/BecomeMaker'
import ProductDetail from '@/pages/ProductDetail'
import Profile from '@/pages/Profile'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminComments from '@/pages/admin/AdminComments'
import AdminMakerRequests from '@/pages/admin/AdminMakerRequests'

function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  )
}

function AdminGuard() {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground">Admin Panel</span>
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/become-maker" element={<BecomeMaker />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/profile/:id" element={<Profile />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/comments" element={<AdminComments />} />
          <Route path="/admin/maker-requests" element={<AdminMakerRequests />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="launchpad-theme">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
