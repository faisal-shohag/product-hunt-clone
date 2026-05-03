import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function BecomeMaker() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const [pendingRequest, setPendingRequest] = React.useState(false)

  React.useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    checkStatus()
  }, [user, navigate])

  const checkStatus = async () => {
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_maker')
      .eq('id', user.id)
      .maybeSingle()

    const typedProfile = profile as unknown as { is_maker: boolean } | null

    if (typedProfile?.is_maker) {
      navigate('/')
      toast.success('You are already a maker!')
      return
    }

    const { data: request } = await supabase
      .from('maker_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .single()

    setPendingRequest(!!request)
  }

  const handleStartPayment = async (cardNumber?: string) => {
    if (!user) return

    setLoading(true)
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`

      // Step 1: Create payment intent
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create-payment-intent' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment setup failed')
      }

      const { paymentIntentId } = await response.json()

      // Step 2: Confirm payment with demo card
      const confirmResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'confirm-payment',
          paymentIntentId,
          cardNumber: cardNumber || '4242424242424242'
        }),
      })

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json()
        throw new Error(error.error || 'Payment confirmation failed')
      }

      const result = await confirmResponse.json()
      toast.success(result.message)
      await refreshProfile()
      navigate('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (pendingRequest) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader>
            <CardTitle>Maker Application Pending</CardTitle>
            <CardDescription>Your maker payment is being processed by our admin team.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You will be notified once your request is reviewed. This typically takes 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Become a Maker</h1>
        <p className="text-lg text-muted-foreground">
          Unlock the ability to submit products to our platform
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl">Maker Subscription</CardTitle>
              <Badge className="bg-primary">One-time payment</Badge>
            </div>
            <CardDescription>Everything you need to submit products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">$9.99</span>
              <span className="text-muted-foreground">one-time</span>
            </div>

            <Separator />

            <ul className="space-y-3">
              {[
                'Submit unlimited products',
                'Edit and manage your products',
                'Track product performance',
                'Unlimited comments and voting',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="size-5 text-green-500 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This is a demo payment. In production, this would process a real Stripe payment.
              </p>
              <Button
                onClick={() => handleStartPayment()}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Processing...
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    Become a Maker Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-base">Why become a maker?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Reach thousands of potential users</li>
              <li>• Get feedback from our community</li>
              <li>• Grow your product visibility</li>
              <li>• Connect with other makers</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
