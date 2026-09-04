# Llama Plus subscription demo

A deliberately small Stripe-hosted Checkout integration built for the Stripe PM written exercise. Llama Inc. sells one recurring plan for USD 8 per month in Stripe test mode.

## Journey

1. The browser posts to a server route; the Price ID never comes from user input.
2. The server creates a subscription-mode Checkout Session and redirects to Stripe.
3. Stripe returns the browser with `{CHECKOUT_SESSION_ID}` in the success URL.
4. The success page retrieves that Session server-side and distinguishes paid from pending settlement.
5. Signed webhook events map to explicit access decisions.
6. A paid customer can open Stripe's hosted Customer Portal to update payment details, view invoices, or cancel at period end.

Dynamic payment methods remain enabled by omitting `payment_method_types`. Stripe therefore decides which eligible methods to show based on the sandbox configuration, customer context, currency, and recurring-payment support.

## Deliberate scope

- Test mode only; no real money moves.
- One USD-denominated flat-rate plan, with English product copy.
- No authentication or durable application database. The webhook route verifies signatures and records the intended lifecycle decision, but production fulfillment would first store `event.id` under a unique constraint and apply the decision to an authenticated account.
- Tax registrations, localized legal copy, FX economics, refunds, disputes, customer communications, and live-business onboarding are outside this prototype.
- "Available worldwide" means the demo is publicly reachable. It does not imply that every local payment method supports a USD subscription from every merchant country.

## Run locally

Requirements: Node.js, npm, and Stripe CLI.

```bash
npm install
copy .env.example .env.local
stripe listen --forward-to localhost:3000/api/webhooks
npm run dev
```

Set the resulting webhook signing secret and your sandbox resource IDs in `.env.local`. Then open `http://localhost:3000`.

Useful test cards:

| Scenario | Card number |
| --- | --- |
| Successful payment | `4242 4242 4242 4242` |
| 3DS authentication | `4000 0025 0000 3155` |
| Declined payment | `4000 0000 0000 9995` |

## Webhook decisions

| Event | Prototype decision |
| --- | --- |
| `checkout.session.completed` with paid status | Grant access |
| `checkout.session.completed` with pending status | Wait for settlement |
| `checkout.session.async_payment_succeeded` | Grant access |
| `invoice.paid` | Grant or continue access |
| `invoice.payment_failed` | Enter recovery/grace flow |
| `customer.subscription.updated` | Synchronize status |
| `customer.subscription.deleted` | Revoke access |

In the sandbox's `2026-08-26.dahlia` API version, an end-of-period Portal cancellation emitted two `customer.subscription.updated` events: the first set `cancel_at` to the item period end, and the second added cancellation feedback. `cancel_at_period_end` remained `false`. Consumers should reconcile current state rather than infer one business transition from one event name.

## Deploy

Deploy the repository as a Next.js app, set the five environment variables from `.env.example`, and register `https://YOUR_DOMAIN/api/webhooks` as a Stripe webhook endpoint. Set `NEXT_PUBLIC_APP_URL` to the same HTTPS origin.
