import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, requireStripeConfig } from "@/lib/stripe";

function getAppOrigin(request: NextRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  return configuredUrl
    ? new URL(configuredUrl).origin
    : request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const origin = getAppOrigin(request);

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: requireStripeConfig("STRIPE_PRICE_ID"),
          quantity: 1,
        },
      ],
      billing_address_collection: "auto",
      locale: "auto",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: {
        integration: "saas-subscriptions-guide",
        plan: "llama-plus",
      },
      subscription_data: {
        metadata: {
          plan: "llama-plus",
        },
      },
      // Omitting payment_method_types keeps Dashboard-managed dynamic methods enabled.
    });

    if (!session.url) {
      throw new Error("Stripe created a Checkout Session without a URL.");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe Checkout Session creation failed", {
        code: error.code,
        requestId: error.requestId,
        type: error.type,
      });
      return NextResponse.redirect(
        new URL("/?checkout=unavailable", origin),
        303,
      );
    }

    throw error;
  }
}
