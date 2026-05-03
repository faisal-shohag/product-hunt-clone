import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.105.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulated Stripe-like payment system
function generatePaymentIntentId(): string {
  return `pi_demo_${Math.random().toString(36).substr(2, 9)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT token
    const { data: user } = await supabase.auth.getUser(token);
    if (!user || !user.user?.id) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.user.id;
    const body = await req.json();
    const { action } = body;

    if (action === "create-payment-intent") {
      // Create a simulated payment intent (like Stripe PaymentIntent)
      const paymentIntentId = generatePaymentIntentId();
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 20)}`;

      // Store the payment intent in maker_requests
      const { error: insertError } = await supabase.from("maker_requests").insert({
        user_id: userId,
        payment_intent_id: paymentIntentId,
        status: "PENDING",
        amount: 999,
      } as never);

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          clientSecret,
          paymentIntentId,
          simulationMode: true,
          message: "Demo payment intent created. Check the demo card section for testing.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "confirm-payment") {
      const { paymentIntentId, cardNumber } = body;

      // Simulate card validation
      if (!cardNumber || cardNumber === "4242424242424242") {
        // Simulate success for demo card
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_maker: true } as never)
          .eq("id", userId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Update maker request status
        await supabase
          .from("maker_requests")
          .update({ status: "APPROVED", reviewed_at: new Date().toISOString() } as never)
          .eq("payment_intent_id", paymentIntentId);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment successful! You are now a Maker.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (cardNumber === "4000000000000002") {
        // Simulate declined card
        return new Response(
          JSON.stringify({ error: "Card declined. Use 4242424242424242 for demo success." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid card number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
