import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { decideSubscriptionAction } from "@/lib/subscription-lifecycle";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 },
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 503 },
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json(
        { error: "Webhook signature verification failed." },
        { status: 400 },
      );
    }

    throw error;
  }

  const decision = decideSubscriptionAction(event);

  // Production fulfillment must persist event.id uniquely before applying this decision.
  console.info("Stripe subscription lifecycle event", {
    eventId: event.id,
    eventType: event.type,
    ...decision,
  });

  return NextResponse.json({ received: true });
}
