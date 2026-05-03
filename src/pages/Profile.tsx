import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Product, Profile as ProfileType, ProductWithMeta } from '@/lib/database.types'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = React.useState<ProfileType | null>(null)
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    if (!id) return

    const [{ data: p }, { data: rawProducts }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('products')
        .select('*, profiles(id, name, avatar_url)')
        .eq('user_id', id)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false }),
    ])

    setProfile(p)

    const products = (rawProducts ?? []) as unknown as (Product & { profiles: ProductWithMeta['profiles'] })[]
    const productIds = products.map((pr) => pr.id)
    const [{ data: votes }, { data: userVotes }] = await Promise.all([
      supabase.from('votes').select('product_id').in('product_id', productIds),
      user
        ? supabase.from('votes').select('product_id').eq('user_id', user.id).in('product_id', productIds)
        : Promise.resolve({ data: [] as { product_id: string }[] }),
    ])

    const voteMap = new Map<string, number>()
    const userVotedSet = new Set<string>()
    ;(votes ?? []).forEach((v) => {
      const vote = v as unknown as { product_id: string }
      voteMap.set(vote.product_id, (voteMap.get(vote.product_id) ?? 0) + 1)
    })
    ;(userVotes ?? []).forEach((v) => {
      const vote = v as unknown as { product_id: string }
      userVotedSet.add(vote.product_id)
    })

    setProducts(
      products.map((pr) => ({
        ...pr,
        vote_count: voteMap.get(pr.id) ?? 0,
        user_has_voted: userVotedSet.has(pr.id),
      })) as ProductWithMeta[]
    )

    setLoading(false)
  }, [id, user])

  React.useEffect(() => { fetchData() }, [fetchData])

  const handleVote = async (productId: string, hasVoted: boolean) => {
    if (!user) { toast.error('Sign in to vote'); return }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, vote_count: p.vote_count + (hasVoted ? -1 : 1), user_has_voted: !hasVoted } : p
      )
    )
    if (hasVoted) {
      await supabase.from('votes').delete().eq('user_id', user.id).eq('product_id', productId)
    } else {
      await supabase.from('votes').insert({ user_id: user.id, product_id: productId } as never)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <Link to="/" className="text-primary hover:underline">Go home</Link>
      </div>
    )
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-8">
        <Avatar className="size-20">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{profile.name || 'Anonymous'}</h1>
            {profile.role === 'ADMIN' && <Badge>Admin</Badge>}
            {profile.banned && <Badge variant="destructive">Banned</Badge>}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="size-3.5" />
            Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Products */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Package className="size-5" />
          <h2 className="text-lg font-semibold">Products ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No approved products yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onVote={handleVote} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
