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
import { Check, X, ArrowUpDown } from 'lucide-react'
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
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import type { MakerRequest, Profile } from '@/lib/database.types'

type MakerRequestRow = MakerRequest & {
  user_name: string
  user_avatar: string | null
}

export default function AdminMakerRequests() {
  const [data, setData] = React.useState<MakerRequestRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const fetchRequests = React.useCallback(async () => {
    setLoading(true)
    const { data: requests } = await supabase
      .from('maker_requests')
      .select('*, profiles:user_id(name, avatar_url)')
      .order('requested_at', { ascending: false })

    const typedRequests = (requests ?? []) as unknown as (MakerRequest & { profiles: Pick<Profile, 'name' | 'avatar_url'> | null })[]

    setData(
      typedRequests.map((r) => ({
        ...r,
        user_name: r.profiles?.name ?? 'Unknown',
        user_avatar: r.profiles?.avatar_url ?? null,
      }))
    )
    setLoading(false)
  }, [])

  React.useEffect(() => { fetchRequests() }, [fetchRequests])

  const approveRequest = async (id: string, userId: string) => {
    await supabase.from('maker_requests').update({ status: 'APPROVED' } as never).eq('id', id)
    await supabase.from('profiles').update({ is_maker: true } as never).eq('id', userId)
    toast.success('Maker request approved')
    setData((d) => d.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r))
  }

  const rejectRequest = async (id: string) => {
    await supabase.from('maker_requests').update({ status: 'REJECTED' } as never).eq('id', id)
    toast.success('Maker request rejected')
    setData((d) => d.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r))
  }

  const columns: ColumnDef<MakerRequestRow>[] = [
    {
      id: 'user',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
          User <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const r = row.original
        const initials = r.user_name?.[0]?.toUpperCase() ?? '?'
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src={r.user_avatar ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <Link to={`/profile/${r.user_id}`} className="text-sm font-medium hover:underline">
              {r.user_name}
            </Link>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'APPROVED' ? 'default' : row.original.status === 'REJECTED' ? 'destructive' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          ${(row.original.amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'requested',
      header: 'Requested',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(row.original.requested_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const r = row.original
        const isPending = r.status === 'PENDING'
        return (
          <div className="flex items-center gap-1">
            {isPending && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-green-500 hover:text-green-600"
                      title="Approve"
                    >
                      <Check className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve maker request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {r.user_name} will be upgraded to a maker and can submit products.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => approveRequest(r.id, r.user_id)}>
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive/80"
                      title="Reject"
                    >
                      <X className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject maker request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {r.user_name} will not be upgraded to maker status.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => rejectRequest(r.id)}>
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
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
        <h1 className="text-2xl font-bold tracking-tight">Maker Requests</h1>
        <p className="text-muted-foreground">Review and approve user maker payment requests</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">{data.length} requests</span>
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
                  No maker requests found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
