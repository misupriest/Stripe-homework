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
  const formData = await request.formData();
  const sessionId = formData.get("session_id");

  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return NextResponse.json(
      { error: "A valid Checkout Session ID is required." },
      { status: 400 },
    );
  }

  const origin = getAppOrigin(request);

  try {
    const checkoutSession =
      await getStripe().checkout.sessions.retrieve(sessionId);
    const customer =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id;

    if (!customer) {
      return NextResponse.json(
        { error: "No Stripe Customer is associated with this session." },
        { status: 409 },
      );
    }

    // A production app must authorize the signed-in user before using its stored Customer ID.
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer,
      configuration: requireStripeConfig(
        "STRIPE_PORTAL_CONFIGURATION_ID",
      ),
      return_url: `${origin}/success?session_id=${encodeURIComponent(sessionId)}&portal=returned`,
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe Customer Portal creation failed", {
        code: error.code,
        requestId: error.requestId,
        type: error.type,
      });
      const returnUrl = new URL("/success", origin);
      returnUrl.searchParams.set("session_id", sessionId);
      returnUrl.searchParams.set("portal", "unavailable");
      return NextResponse.redirect(returnUrl, 303);
    }

    throw error;
  }
}
