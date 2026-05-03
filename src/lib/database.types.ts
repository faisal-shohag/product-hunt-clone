export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          role: 'USER' | 'ADMIN'
          banned: boolean
          is_maker: boolean
          maker_requested_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string
          avatar_url?: string | null
          role?: 'USER' | 'ADMIN'
          banned?: boolean
          is_maker?: boolean
          maker_requested_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          role?: 'USER' | 'ADMIN'
          banned?: boolean
          is_maker?: boolean
          maker_requested_at?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          tagline: string
          description: string
          url: string
          thumbnail: string | null
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          featured: boolean
          user_id: string
          launching_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          tagline?: string
          description?: string
          url?: string
          thumbnail?: string | null
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          featured?: boolean
          user_id: string
          launching_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string
          description?: string
          url?: string
          thumbnail?: string | null
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          featured?: boolean
          user_id?: string
          launching_at?: string | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      comment_votes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          vote_type: 'UP' | 'DOWN'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          vote_type: 'UP' | 'DOWN'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          vote_type?: 'UP' | 'DOWN'
          created_at?: string
        }
      }
      maker_requests: {
        Row: {
          id: string
          user_id: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          payment_intent_id: string | null
          amount: number
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          payment_intent_id?: string | null
          amount?: number
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          payment_intent_id?: string | null
          amount?: number
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          notes?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

export type ProductWithMeta = Product & {
  profiles: Pick<Profile, 'id' | 'name' | 'avatar_url'>
  vote_count: number
  user_has_voted?: boolean
  comment_count?: number
}

export type CommentWithProfile = Comment & {
  profiles: Pick<Profile, 'id' | 'name' | 'avatar_url'>
  vote_count?: number
  user_vote?: 'UP' | 'DOWN' | null
}

export type MakerRequest = Database['public']['Tables']['maker_requests']['Row']
export type CommentVote = Database['public']['Tables']['comment_votes']['Row']
