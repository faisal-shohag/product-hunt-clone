import * as React from 'react'
import { Link } from 'react-router-dom'
import { Search, Flame, Clock, Star, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyDescription } from '@/components/ui/empty'
import { ProductCard } from '@/components/ProductCard'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Footer } from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Product, Profile, ProductWithMeta } from '@/lib/database.types'
import { toast } from 'sonner'

type SortMode = 'trending' | 'newest' | 'top'

export default function Home() {
  const { user } = useAuth()
  const [products, setProducts] = React.useState<ProductWithMeta[]>([])
  const [upcomingProducts, setUpcomingProducts] = React.useState<ProductWithMeta[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sort, setSort] = React.useState<SortMode>('trending')
  const [searchQuery, setSearchQuery] = React.useState('')

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    try {
      // Fetch approved products
      const { data: rawProducts, error: productsError } = await supabase
        .from('products')
        .select('*, profiles(id, name, avatar_url)')
        .eq('status', 'APPROVED')
        .or('launching_at.is.null,launching_at.lte.now()')
        .order('created_at', { ascending: false })

      // Fetch upcoming products (with future launching_at)
      const { data: rawUpcoming, error: upcomingError } = await supabase
        .from('products')
        .select('*, profiles(id, name, avatar_url)')
        .eq('status', 'APPROVED')
        .gt('launching_at', new Date().toISOString())
        .order('launching_at', { ascending: true })
        .limit(6)

      if (productsError) throw productsError
      if (upcomingError) throw upcomingError

      const products = (rawProducts ?? []) as unknown as (Product & { profiles: Pick<Profile, 'id' | 'name' | 'avatar_url'> })[]
      const upcoming = (rawUpcoming ?? []) as unknown as (Product & { profiles: Pick<Profile, 'id' | 'name' | 'avatar_url'> })[]

      const allProductIds = [...products, ...upcoming].map((p) => p.id)

      const [votesResult, commentsResult, userVotesResult] = await Promise.all([
        supabase.from('votes').select('product_id').in('product_id', allProductIds),
        supabase.from('comments').select('product_id').in('product_id', allProductIds),
        user
          ? supabase.from('votes').select('product_id').eq('user_id', user.id).in('product_id', allProductIds)
          : Promise.resolve({ data: [] as { product_id: string }[] }),
      ])

      const voteMap = new Map<string, number>()
      const commentMap = new Map<string, number>()
      const userVotedSet = new Set<string>()

      ;(votesResult.data ?? []).forEach((v) => {
        const vote = v as unknown as { product_id: string }
        voteMap.set(vote.product_id, (voteMap.get(vote.product_id) ?? 0) + 1)
      })
      ;(commentsResult.data ?? []).forEach((c) => {
        const comment = c as unknown as { product_id: string }
        commentMap.set(comment.product_id, (commentMap.get(comment.product_id) ?? 0) + 1)
      })
      ;(userVotesResult.data ?? []).forEach((v) => {
        const vote = v as unknown as { product_id: string }
        userVotedSet.add(vote.product_id)
      })

      const withMeta = (p: Product & { profiles: Pick<Profile, 'id' | 'name' | 'avatar_url'> }): ProductWithMeta => ({
        ...p,
        vote_count: voteMap.get(p.id) ?? 0,
        user_has_voted: userVotedSet.has(p.id),
        comment_count: commentMap.get(p.id) ?? 0,
      })

      const sortedProducts = products.map(withMeta)
      if (sort === 'trending') sortedProducts.sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
      if (sort === 'top') sortedProducts.sort((a, b) => ((b.vote_count ?? 0) + (b.comment_count ?? 0)) - ((a.vote_count ?? 0) + (a.comment_count ?? 0)))

      setProducts(sortedProducts)
      setUpcomingProducts(upcoming.map(withMeta))
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [user, sort])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="space-y-2">
                <Badge className="mx-auto" variant="secondary">
                  <Sparkles className="size-3 mr-1" />
                  Discover Amazing Products
                </Badge>
                <h1 className="scroll-m-20 text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
                  Launch Your Next Big Thing
                </h1>
                <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
                  Explore innovative products and connect with makers. Find tools that transform the way you work.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  placeholder="Search products, makers, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base rounded-lg"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button size="lg" asChild>
                  <Link to="/submit">
                    Submit Your Product
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/become-maker">Become a Maker</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Products Section */}
        {upcomingProducts.length > 0 && (
          <section className="py-16 border-b bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
                  <Clock className="size-6 text-primary" />
                  Coming Soon
                </h2>
                <p className="text-muted-foreground">Check out these exciting products launching soon</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    {product.thumbnail && (
                      <div className="w-full h-40 bg-muted overflow-hidden">
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.tagline}</p>
                      </div>
                      <Badge variant="outline" className="w-fit">
                        Launching Soon
                      </Badge>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">Launch in:</div>
                        {product.launching_at && <CountdownTimer targetDate={product.launching_at} compact />}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={`/product/${product.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-col gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
                  <TrendingUp className="size-6 text-primary" />
                  Browse Products
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `Found ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`
                    : 'Discover products from innovative makers'}
                </p>
              </div>

              <Tabs value={sort} onValueChange={(v) => setSort(v as SortMode)} className="w-full">
                <TabsList className="bg-muted">
                  <TabsTrigger value="trending" className="flex gap-1">
                    <Flame className="size-4" />
                    <span className="hidden sm:inline">Trending</span>
                  </TabsTrigger>
                  <TabsTrigger value="newest" className="flex gap-1">
                    <Clock className="size-4" />
                    <span className="hidden sm:inline">Newest</span>
                  </TabsTrigger>
                  <TabsTrigger value="top" className="flex gap-1">
                    <Star className="size-4" />
                    <span className="hidden sm:inline">Top Rated</span>
                  </TabsTrigger>
                </TabsList>

                {['trending', 'newest', 'top'].map((mode) => (
                  <TabsContent key={mode} value={mode} className="mt-6">
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-4 space-y-3">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <Empty>
                        <EmptyMedia>
                          <Sparkles className="size-8 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyHeader>No products found</EmptyHeader>
                        <EmptyDescription>
                          {searchQuery
                            ? 'Try adjusting your search terms'
                            : 'Check back soon for more amazing products'}
                        </EmptyDescription>
                      </Empty>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => (
                          <ProductCard key={product.id} product={product} onVote={() => fetchProducts()} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
