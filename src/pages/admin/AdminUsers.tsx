import * as React from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { Ban, CircleCheck as CheckCircle, Shield, ShieldOff, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { Profile } from '@/lib/database.types'

type UserRow = Profile & { product_count: number }

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [data, setData] = React.useState<UserRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: productCounts } = await supabase.from('products').select('user_id')

    const countMap = new Map<string, number>()
    ;(productCounts ?? []).forEach((p) => {
      const row = p as unknown as { user_id: string }
      countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1)
    })

    setData((profiles as unknown as Profile[] ?? []).map((p) => ({ ...p, product_count: countMap.get(p.id) ?? 0 })))
    setLoading(false)
  }, [])

  React.useEffect(() => { fetchUsers() }, [fetchUsers])

  const toggleBan = async (id: string, banned: boolean) => {
    if (id === currentUser?.id) { toast.error("You can't ban yourself"); return }
    await supabase.from('profiles').update({ banned: !banned } as never).eq('id', id)
    toast.success(banned ? 'User unbanned' : 'User banned')
    setData((d) => d.map((u) => u.id === id ? { ...u, banned: !banned } : u))
  }

  const toggleAdmin = async (id: string, role: string) => {
    if (id === currentUser?.id) { toast.error("You can't change your own role"); return }
    const newRole = role === 'ADMIN' ? 'USER' : 'ADMIN'
    await supabase.from('profiles').update({ role: newRole } as never).eq('id', id)
    toast.success(`User role changed to ${newRole}`)
    setData((d) => d.map((u) => u.id === id ? { ...u, role: newRole as 'USER' | 'ADMIN' } : u))
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      id: 'user',
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
          User <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const u = row.original
        const initials = u.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{u.name || 'Anonymous'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'ADMIN' ? 'default' : 'secondary'}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        row.original.banned
          ? <Badge variant="destructive">Banned</Badge>
          : <Badge variant="outline" className="text-green-600 border-green-500/30">Active</Badge>
      ),
    },
    {
      accessorKey: 'product_count',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
          Products <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="tabular-nums">{row.original.product_count}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const u = row.original
        const isSelf = u.id === currentUser?.id
        return (
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={u.banned ? 'text-green-500' : 'text-destructive'}
                  disabled={isSelf}
                  title={u.banned ? 'Unban' : 'Ban'}
                >
                  {u.banned ? <CheckCircle className="size-4" /> : <Ban className="size-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>{u.banned ? 'Unban' : 'Ban'} user?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {u.banned
                      ? `${u.name || 'This user'} will be able to submit and vote again.`
                      : `${u.name || 'This user'} will be prevented from submitting or voting.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant={u.banned ? 'default' : 'destructive'}
                    onClick={() => toggleBan(u.id, u.banned)}
                  >
                    {u.banned ? 'Unban' : 'Ban'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="ghost"
              size="icon-sm"
              className={u.role === 'ADMIN' ? 'text-primary' : 'text-muted-foreground'}
              disabled={isSelf}
              onClick={() => toggleAdmin(u.id, u.role)}
              title={u.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
            >
              {u.role === 'ADMIN' ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage users and access control</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">{data.length} users</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={row.original.banned ? 'opacity-60' : ''}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
