import type Stripe from "stripe";

export type SubscriptionAction =
  | "grant_access"
  | "await_payment"
  | "recover_payment"
  | "revoke_access"
  | "sync_subscription"
  | "ignore";

export type LifecycleDecision = {
  action: SubscriptionAction;
  objectId?: string;
  reason: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(
  record: Record<string, unknown>,
  property: string,
): string | undefined {
  const value = record[property];
  return typeof value === "string" ? value : undefined;
}

export function decideSubscriptionAction(
  event: Stripe.Event,
): LifecycleDecision {
  const eventObject: unknown = event.data.object;
  const object = isRecord(eventObject) ? eventObject : {};
  const objectId = readString(object, "id");

  switch (event.type) {
    case "checkout.session.completed":
      if (readString(object, "payment_status") === "paid") {
        return {
          action: "grant_access",
          objectId,
          reason: "Checkout completed with a paid initial invoice.",
        };
      }
      return {
        action: "await_payment",
        objectId,
        reason:
          "Checkout completed, but a delayed payment method has not settled.",
      };

    case "checkout.session.async_payment_succeeded":
    case "invoice.paid":
      return {
        action: "grant_access",
        objectId,
        reason: "Stripe confirmed that subscription payment succeeded.",
      };

    case "invoice.payment_failed":
      return {
        action: "recover_payment",
        objectId,
        reason:
          "Payment failed; retain a grace period and direct the customer to the portal.",
      };

    case "customer.subscription.deleted":
      return {
        action: "revoke_access",
        objectId,
        reason: "The subscription ended.",
      };

    case "customer.subscription.updated":
      return {
        action: "sync_subscription",
        objectId,
        reason:
          "Subscription status or cancellation timing changed and must be synchronized.",
      };

    default:
      return {
        action: "ignore",
        objectId,
        reason: "This event does not change Llama Plus access.",
      };
  }
}
