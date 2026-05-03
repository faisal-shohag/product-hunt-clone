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
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { CircleCheck as CheckCircle, Circle as XCircle, Trash2, ExternalLink, ArrowUpDown, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { Product } from '@/lib/database.types'

type ProductRow = Product & { creator_name: string; vote_count: number }

export default function AdminProducts() {
  const [data, setData] = React.useState<ProductRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    const { data: rawProducts } = await supabase
      .from('products')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false })

    const products = (rawProducts ?? []) as unknown as (Product & { profiles: { name: string } | null })[]
    const ids = products.map((p) => p.id)
    const { data: votes } = await supabase.from('votes').select('product_id').in('product_id', ids)

    const voteMap = new Map<string, number>()
    ;(votes ?? []).forEach((v) => {
      const vote = v as unknown as { product_id: string }
      voteMap.set(vote.product_id, (voteMap.get(vote.product_id) ?? 0) + 1)
    })

    setData(
      products.map((p) => ({
        ...p,
        profiles: undefined,
        creator_name: p.profiles?.name ?? 'Unknown',
        vote_count: voteMap.get(p.id) ?? 0,
      }))
    )
    setLoading(false)
  }, [])

  React.useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase.from('products').update({ status } as never).eq('id', id)
    if (error) { toast.error('Update failed'); return }
    toast.success(`Product ${status.toLowerCase()}`)
    setData((d) => d.map((p) => p.id === id ? { ...p, status } : p))
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from('products').update({ featured: !featured } as never).eq('id', id)
    toast.success(featured ? 'Removed from featured' : 'Added to featured')
    setData((d) => d.map((p) => p.id === id ? { ...p, featured: !featured } : p))
  }

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    toast.success('Product deleted')
    setData((d) => d.filter((p) => p.id !== id))
  }

  const columns: ColumnDef<ProductRow>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
          Product <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{row.original.name}</span>
            {row.original.featured && <Star className="size-3 text-amber-500 fill-amber-500" />}
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.original.tagline}</p>
        </div>
      ),
    },
    {
      accessorKey: 'creator_name',
      header: 'Creator',
      cell: ({ row }) => <span className="text-sm">{row.original.creator_name}</span>,
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
      accessorKey: 'vote_count',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
          Votes <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.vote_count}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
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
        const p = row.original
        return (
          <div className="flex items-center gap-1">
            {p.status !== 'APPROVED' && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-green-500 hover:text-green-600"
                onClick={() => updateStatus(p.id, 'APPROVED')}
                title="Approve"
              >
                <CheckCircle className="size-4" />
              </Button>
            )}
            {p.status !== 'REJECTED' && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive/80"
                onClick={() => updateStatus(p.id, 'REJECTED')}
                title="Reject"
              >
                <XCircle className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className={p.featured ? 'text-amber-500' : 'text-muted-foreground'}
              onClick={() => toggleFeatured(p.id, p.featured)}
              title={p.featured ? 'Unfeature' : 'Feature'}
            >
              {p.featured ? <StarOff className="size-4" /> : <Star className="size-4" />}
            </Button>
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground" title="Visit">
                  <ExternalLink className="size-4" />
                </Button>
              </a>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-destructive" title="Delete">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete <strong>{p.name}</strong> and all its votes and comments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => deleteProduct(p.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  const filtered = React.useMemo(
    () => statusFilter === 'ALL' ? data : data.filter((p) => p.status === statusFilter),
    [data, statusFilter]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Manage and moderate product submissions</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search products..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} products</span>
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
                  No products found
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

      {/* Pagination */}
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
