import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, ArrowUp, Send, Trash2, Calendar, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Product, ProductWithMeta, CommentWithProfile } from '@/lib/database.types'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const [product, setProduct] = React.useState<ProductWithMeta | null>(null)
  const [comments, setComments] = React.useState<CommentWithProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [commentText, setCommentText] = React.useState('')
  const [submittingComment, setSubmittingComment] = React.useState(false)

  const fetchProduct = React.useCallback(async () => {
    if (!id) return
    const { data: p } = await supabase
      .from('products')
      .select('*, profiles(id, name, avatar_url)')
      .eq('id', id)
      .maybeSingle()

    if (!p) { setLoading(false); return }
    const product = p as unknown as Product & { profiles: ProductWithMeta['profiles'] }

    const { data: rawComments } = await supabase.from('comments').select('*, profiles(id, name, avatar_url)').eq('product_id', id).order('created_at', { ascending: true })

    const [{ data: votes }, { data: userVotes }, { data: commentVotesData }] = await Promise.all([
      supabase.from('votes').select('id').eq('product_id', id),
      user ? supabase.from('votes').select('id').eq('product_id', id).eq('user_id', user.id) : Promise.resolve({ data: [] }),
      supabase.from('comment_votes').select('*').in('comment_id', (rawComments ?? []).map((c: any) => c.id)),
    ])

    setProduct({
      ...product,
      vote_count: votes?.length ?? 0,
      user_has_voted: (userVotes?.length ?? 0) > 0,
    } as ProductWithMeta)

    const voteMap = new Map<string, { up: number; down: number; userVote: 'UP' | 'DOWN' | null }>()
    ;(commentVotesData ?? []).forEach((v) => {
      const vote = v as unknown as { comment_id: string; vote_type: 'UP' | 'DOWN'; user_id: string }
      if (!voteMap.has(vote.comment_id)) {
        voteMap.set(vote.comment_id, { up: 0, down: 0, userVote: null })
      }
      const current = voteMap.get(vote.comment_id)!
      if (vote.vote_type === 'UP') current.up++
      else current.down++
      if (user?.id === vote.user_id) current.userVote = vote.vote_type
    })

    const commentsWithVotes = (rawComments ?? []).map((c: any) => {
      const votes = voteMap.get(c.id) || { up: 0, down: 0, userVote: null }
      return {
        ...c,
        vote_count: votes.up - votes.down,
        user_vote: votes.userVote,
      }
    })

    setComments(commentsWithVotes as unknown as CommentWithProfile[])
    setLoading(false)
  }, [id, user])

  React.useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleVote = async () => {
    if (!user || !product) { toast.error('Sign in to vote'); return }
    const hasVoted = product.user_has_voted ?? false

    setProduct((p) => p ? { ...p, vote_count: p.vote_count + (hasVoted ? -1 : 1), user_has_voted: !hasVoted } : p)

    if (hasVoted) {
      await supabase.from('votes').delete().eq('user_id', user.id).eq('product_id', product.id)
    } else {
      await supabase.from('votes').insert({ user_id: user.id, product_id: product.id } as never)
    }
  }

  const handleComment = async () => {
    if (!user || !product) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setSubmittingComment(true)
    const { error } = await supabase.from('comments').insert({
      content: commentText.trim(),
      user_id: user.id,
      product_id: product.id,
    } as never)
    setSubmittingComment(false)
    if (error) { toast.error('Failed to post comment'); return }
    setCommentText('')
    fetchProduct()
  }

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((c) => c.filter((x) => x.id !== commentId))
    toast.success('Comment deleted')
  }

  const handleCommentVote = async (commentId: string, voteType: 'UP' | 'DOWN') => {
    if (!user) {
      toast.error('Sign in to vote')
      return
    }

    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    const currentVote = comment.user_vote

    if (currentVote === voteType) {
      // Remove vote
      await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id)
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, vote_count: (c.vote_count ?? 0) - (voteType === 'UP' ? 1 : -1), user_vote: null } : c
      ))
    } else {
      // Add or change vote
      const delta = currentVote === null ? (voteType === 'UP' ? 1 : -1) : voteType === 'UP' ? 2 : -2
      await supabase.from('comment_votes').upsert({
        user_id: user.id,
        comment_id: commentId,
        vote_type: voteType,
      } as never, { onConflict: 'user_id,comment_id' })
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, vote_count: (c.vote_count ?? 0) + delta, user_vote: voteType } : c
      ))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-4">
          <Skeleton className="size-20 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Product not found</h2>
        <Button variant="ghost" asChild><Link to="/">Go home</Link></Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link to="/"><ArrowLeft className="size-4" />Back</Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="size-20 rounded-xl overflow-hidden border bg-muted flex items-center justify-center shrink-0">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} className="size-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">{product.name[0]}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.featured && <Badge variant="secondary">Featured</Badge>}
            <Badge variant={product.status === 'APPROVED' ? 'default' : product.status === 'REJECTED' ? 'destructive' : 'secondary'}>
              {product.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{product.tagline}</p>

          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Avatar size="sm" className="size-5">
                <AvatarImage src={product.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{product.profiles?.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <Link to={`/profile/${product.profiles?.id}`} className="hover:text-foreground">
                {product.profiles?.name}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <Button
            variant="outline"
            className={cn(
              'flex flex-col h-auto gap-0 px-4 py-3',
              product.user_has_voted && 'border-primary text-primary bg-primary/5'
            )}
            onClick={handleVote}
          >
            <ArrowUp className={cn('size-5', product.user_has_voted && 'fill-primary')} />
            <span className="text-sm font-bold tabular-nums">{product.vote_count}</span>
          </Button>
          {product.url && (
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon-sm">
                <ExternalLink className="size-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-sm max-w-none mb-8">
        <p className="leading-7 text-foreground whitespace-pre-wrap">{product.description}</p>
      </div>

      <Separator className="mb-6" />

      {/* Comments */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Comments ({comments.length})
        </h2>

        {user && (
          <div className="flex gap-3 mb-6">
            <Avatar size="sm" className="mt-1 shrink-0">
              <AvatarFallback className="text-xs">{user.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || submittingComment}
              >
                <Send className="size-4" />
                Post Comment
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar size="sm" className="shrink-0 mt-0.5">
                <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{comment.profiles?.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.profiles?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn('text-muted-foreground', comment.user_vote === 'UP' && 'text-primary')}
                    onClick={() => handleCommentVote(comment.id, 'UP')}
                  >
                    <ThumbsUp className="size-3.5" />
                  </Button>
                  <span className="text-xs font-medium tabular-nums w-6 text-center">{comment.vote_count ?? 0}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn('text-muted-foreground', comment.user_vote === 'DOWN' && 'text-destructive')}
                    onClick={() => handleCommentVote(comment.id, 'DOWN')}
                  >
                    <ThumbsDown className="size-3.5" />
                  </Button>
                </div>
              </div>
              {(isAdmin || user?.id === comment.user_id) && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </section>
    </div>
  )
}
