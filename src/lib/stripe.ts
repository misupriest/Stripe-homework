import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= new Stripe(secretKey, {
    appInfo: {
      name: "llama-stripe-subscriptions",
      version: "0.1.0",
    },
  });

  return stripeClient;
}

export function requireStripeConfig(
  name: "STRIPE_PRICE_ID" | "STRIPE_PORTAL_CONFIGURATION_ID",
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}
