import * as React from 'react'
import { Users, Package, Clock, MessageSquare, TrendingUp, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import type { Product } from '@/lib/database.types'

type Stats = {
  totalUsers: number
  totalProducts: number
  pendingProducts: number
  totalComments: number
  approvedProducts: number
  rejectedProducts: number
}

const chartConfig = {
  approved: { label: 'Approved', color: 'var(--chart-2)' },
  pending: { label: 'Pending', color: 'var(--chart-4)' },
  rejected: { label: 'Rejected', color: 'var(--chart-5)' },
} satisfies ChartConfig

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [recentProducts, setRecentProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalUsers },
        { count: totalProducts },
        { count: pendingProducts },
        { count: approvedProducts },
        { count: rejectedProducts },
        { count: totalComments },
        { data: recent },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED'),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        totalUsers: totalUsers ?? 0,
        totalProducts: totalProducts ?? 0,
        pendingProducts: pendingProducts ?? 0,
        approvedProducts: approvedProducts ?? 0,
        rejectedProducts: rejectedProducts ?? 0,
        totalComments: totalComments ?? 0,
      })
      setRecentProducts(recent ?? [])
      setLoading(false)
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Products', value: stats?.totalProducts, icon: Package, color: 'text-green-500' },
    { label: 'Pending Review', value: stats?.pendingProducts, icon: Clock, color: 'text-amber-500', highlight: true },
    { label: 'Comments', value: stats?.totalComments, icon: MessageSquare, color: 'text-primary' },
  ]

  const chartData = stats
    ? [
        { category: 'Products', approved: stats.approvedProducts, pending: stats.pendingProducts, rejected: stats.rejectedProducts },
      ]
    : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and moderation queue</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, highlight }) => (
          <Card key={label} className={highlight && (stats?.pendingProducts ?? 0) > 0 ? 'border-amber-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold tabular-nums">{value}</div>
              )}
              {highlight && (stats?.pendingProducts ?? 0) > 0 && (
                <Badge variant="secondary" className="mt-1 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Needs attention
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Product Status Overview
            </CardTitle>
            <CardDescription>Distribution of product statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
                  <Bar dataKey="pending" fill="var(--color-pending)" radius={4} />
                  <Bar dataKey="rejected" fill="var(--color-rejected)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest product submissions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/products">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No products yet</p>
            ) : (
              <div className="space-y-3">
                {recentProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.status === 'APPROVED' && <CheckCircle className="size-4 text-green-500" />}
                      {p.status === 'REJECTED' && <XCircle className="size-4 text-destructive" />}
                      {p.status === 'PENDING' && <Clock className="size-4 text-amber-500" />}
                      <Badge
                        variant={p.status === 'APPROVED' ? 'default' : p.status === 'REJECTED' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
