import * as React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Rocket, Lock } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(80),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  url: z.string().url('Must be a valid URL').or(z.literal('')),
  thumbnail: z.string().url('Must be a valid URL').or(z.literal('')),
  launching_at: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function Submit() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (profile?.banned) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <h2 className="text-2xl font-bold mb-2">Account suspended</h2>
        <p className="text-muted-foreground">Your account has been suspended. You cannot submit products.</p>
      </div>
    )
  }

  if (!profile?.is_maker) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Maker Access Required
            </CardTitle>
            <CardDescription>Only makers can submit products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                To submit products, you need to upgrade to a Maker account. This is a one-time payment that unlocks unlimited product submissions.
              </AlertDescription>
            </Alert>
            <Button asChild size="lg" className="w-full">
              <Link to="/become-maker">Upgrade to Maker</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', tagline: '', description: '', url: '', thumbnail: '', launching_at: '' },
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setSubmitting(true)
    const { error } = await supabase.from('products').insert({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      url: data.url || '',
      thumbnail: data.thumbnail || null,
      user_id: user.id,
      status: 'PENDING',
      launching_at: data.launching_at ? new Date(data.launching_at).toISOString() : null,
    } as never)
    setSubmitting(false)

    if (error) {
      toast.error('Failed to submit product. Please try again.')
    } else {
      toast.success('Product submitted! It will appear once approved by an admin.')
      navigate('/')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Submit a Product</h1>
          <Badge variant="secondary">Pending Review</Badge>
        </div>
        <p className="text-muted-foreground">
          Share your product with the community. It will be reviewed before going live.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="size-5" />
            Product Details
          </CardTitle>
          <CardDescription>Fill in the information about your product</CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    placeholder="e.g. Notion, Linear, Figma"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="tagline"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tagline">Tagline *</FieldLabel>
                  <Input
                    {...field}
                    id="tagline"
                    placeholder="A short description of what it does"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Keep it short and punchy (max 120 chars)</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description *</FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Describe your product in detail..."
                    rows={5}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="url"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="url">Product URL</FieldLabel>
                  <Input
                    {...field}
                    id="url"
                    type="url"
                    placeholder="https://yourproduct.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="thumbnail"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="thumbnail">Thumbnail URL</FieldLabel>
                  <Input
                    {...field}
                    id="thumbnail"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Optional: direct link to product logo/image</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="launching_at"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="launching_at">Launch Date & Time</FieldLabel>
                  <Input
                    {...field}
                    id="launching_at"
                    type="datetime-local"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Optional: schedule your product launch for a future date</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Spinner className="mr-2" />}
              Submit for Review
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
