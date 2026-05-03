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
import { Trash2, MessageSquare, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type { Comment, Product, Profile } from '@/lib/database.types'

type CommentRow = Comment & {
  user_name: string
  user_avatar: string | null
  product_name: string
  product_id: string
}

export default function AdminComments() {
  const [data, setData] = React.useState<CommentRow[]>([])
  const [products, setProducts] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [selectedProduct, setSelectedProduct] = React.useState<string>('all')

  const fetchComments = React.useCallback(async () => {
    setLoading(true)
    const { data: comments } = await supabase
      .from('comments')
      .select('*, profiles:user_id(name, avatar_url), products:product_id(id, name)')
      .order('created_at', { ascending: false })

    const { data: prods } = await supabase
      .from('products')
      .select('id, name')
      .eq('status', 'APPROVED')
      .order('name')

    const typedComments = (comments ?? []) as unknown as (Comment & {
      profiles: Pick<Profile, 'name' | 'avatar_url'> | null
      products: Pick<Product, 'id' | 'name'> | null
    })[]

    setData(
      typedComments.map((c) => ({
        ...c,
        user_name: c.profiles?.name ?? 'Unknown',
        user_avatar: c.profiles?.avatar_url ?? null,
        product_name: c.products?.name ?? 'Unknown Product',
        product_id: c.products?.id ?? c.product_id,
      }))
    )

    setProducts(
      (prods ?? []).map((p) => ({
        id: (p as unknown as { id: string; name: string }).id,
        name: (p as unknown as { id: string; name: string }).name,
      }))
    )
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const deleteComment = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id)
    toast.success('Comment deleted')
    setData((d) => d.filter((c) => c.id !== id))
  }

  const columns: ColumnDef<CommentRow>[] = [
    {
      id: 'user',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()}>
          Author <ArrowUpDown className="ml-1 size-3" />
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
            <span className="text-sm font-medium">{r.user_name}</span>
          </div>
        )
      },
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <Link to={`/product/${row.original.product_id}`} className="text-sm font-medium hover:underline">
          {row.original.product_name}
        </Link>
      ),
    },
    {
      id: 'content',
      header: 'Comment',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="text-sm text-foreground line-clamp-2">{row.original.content}</p>
        </div>
      ),
    },
    {
      id: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive/80" title="Delete">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete comment?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => deleteComment(row.original.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ]

  const filteredData = selectedProduct === 'all' ? data : data.filter((c) => c.product_id === selectedProduct)

  const table = useReactTable({
    data: filteredData,
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
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="text-muted-foreground">Manage comments on products</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search comments..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm text-muted-foreground">{filteredData.length} comments</span>
        </div>

        {/* Product Filter Tabs */}
        <Tabs value={selectedProduct} onValueChange={setSelectedProduct} className="w-full">
          <TabsList className="bg-muted overflow-auto w-full justify-start">
            <TabsTrigger value="all" className="flex gap-1">
              <MessageSquare className="size-4" />
              All ({data.length})
            </TabsTrigger>
            {products.map((p) => {
              const count = data.filter((c) => c.product_id === p.id).length
              return (
                <TabsTrigger key={p.id} value={p.id} className="flex gap-1 text-xs">
                  {p.name.substring(0, 12)}... ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
