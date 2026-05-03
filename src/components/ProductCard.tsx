import { Link } from 'react-router-dom'
import { ExternalLink, MessageSquare, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ProductWithMeta } from '@/lib/database.types'

type Props = {
  product: ProductWithMeta
  onVote?: (productId: string, hasVoted: boolean) => void
  showStatus?: boolean
  rank?: number
}

export function ProductCard({ product, onVote, showStatus = false, rank }: Props) {
  const hasVoted = product.user_has_voted ?? false

  return (
    <div className="group flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/20">
      {/* Rank */}
      {rank !== undefined && (
        <span className="hidden sm:flex size-7 shrink-0 items-center justify-center text-sm font-semibold text-muted-foreground">
          {rank}
        </span>
      )}

      {/* Thumbnail */}
      <Link to={`/product/${product.id}`} className="shrink-0">
        <div className="size-14 rounded-xl overflow-hidden border bg-muted flex items-center justify-center">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} className="size-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">
              {product.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/product/${product.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors truncate"
              >
                {product.name}
              </Link>
              {showStatus && (
                <Badge
                  variant={
                    product.status === 'APPROVED'
                      ? 'default'
                      : product.status === 'REJECTED'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="text-xs"
                >
                  {product.status}
                </Badge>
              )}
              {product.featured && (
                <Badge variant="secondary" className="text-xs">Featured</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{product.tagline}</p>
          </div>

          {/* External link */}
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-4 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar size="sm" className="size-5">
              <AvatarImage src={product.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {product.profiles?.name?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <Link
              to={`/profile/${product.profiles?.id}`}
              className="hover:text-foreground transition-colors"
            >
              {product.profiles?.name || 'Unknown'}
            </Link>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="size-3" />
            {product.comment_count ?? 0}
          </div>
        </div>
      </div>

      {/* Vote button */}
      <div className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'flex flex-col h-auto gap-0 px-3 py-2 min-w-[52px]',
            hasVoted && 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
          )}
          onClick={() => onVote?.(product.id, hasVoted)}
        >
          <ArrowUp className={cn('size-4', hasVoted && 'fill-primary')} />
          <span className="text-xs font-semibold tabular-nums">{product.vote_count}</span>
        </Button>
      </div>
    </div>
  )
}
