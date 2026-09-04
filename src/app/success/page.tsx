import Link from "next/link";
import Stripe from "stripe";
import styles from "../page.module.css";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type SuccessProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null || currency === null) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(unixSeconds * 1000));
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className={styles.confirmationCard}>
      <p className={styles.eyebrow}>Checkout status</p>
      <h1>We could not verify this payment.</h1>
      <p className={styles.confirmationCopy}>{message}</p>
      <div className={styles.actions}>
        <Link className={styles.secondaryButton} href="/">
          Return to plan
        </Link>
      </div>
    </div>
  );
}

export default async function Success({ searchParams }: SuccessProps) {
  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string" ? params.session_id : undefined;
  const portalState =
    typeof params.portal === "string" ? params.portal : undefined;

  let content: React.ReactNode;

  if (!sessionId || !sessionId.startsWith("cs_")) {
    content = (
      <ErrorCard message="The return URL did not contain a valid Checkout Session ID." />
    );
  } else {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });
      const paid = session.payment_status === "paid";
      const subscription =
        typeof session.subscription === "string"
          ? undefined
          : session.subscription;
      const cancellationAt =
        subscription?.cancel_at ??
        (subscription?.cancel_at_period_end
          ? subscription.items.data[0]?.current_period_end
          : undefined);
      const subscriptionStatus =
        cancellationAt !== null && cancellationAt !== undefined
          ? `Active until ${formatDate(cancellationAt)}`
          : subscription?.status ?? "created";

      content = (
        <div className={styles.confirmationCard}>
          <div className={styles.confirmationTop}>
            <div>
              <p className={styles.eyebrow}>Llama Plus</p>
              <h1>{paid ? "Payment confirmed." : "Payment is processing."}</h1>
            </div>
            <span className={styles.statusBadge}>
              {paid ? "Paid" : "Pending"}
            </span>
          </div>

          <p className={styles.confirmationCopy}>
            {paid
              ? "Stripe confirmed the initial invoice. A production app would grant access from the verified webhook event, not this browser redirect."
              : "Checkout completed, but access should wait for Stripe to confirm settlement through a webhook."}
          </p>

          {portalState === "returned" ? (
            <div className={styles.notice} role="status">
              Your billing settings were saved in Stripe.
            </div>
          ) : null}
          {portalState === "unavailable" ? (
            <div className={styles.notice} role="status">
              The billing portal could not be opened. Please try again.
            </div>
          ) : null}

          <dl className={styles.details}>
            <div className={styles.detailRow}>
              <dt>Plan</dt>
              <dd>Llama Plus monthly</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Initial total</dt>
              <dd>{formatAmount(session.amount_total, session.currency)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Email</dt>
              <dd>{session.customer_details?.email ?? "Not provided"}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Subscription</dt>
              <dd>{subscriptionStatus}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <form action="/api/portal" method="post">
              <input name="session_id" type="hidden" value={sessionId} />
              <button className={styles.primaryButton} type="submit">
                Manage billing
              </button>
            </form>
            <Link className={styles.secondaryButton} href="/">
              Back to Llama
            </Link>
          </div>
          <p className={styles.finePrint}>
            This public prototype has no user login. Production code would
            resolve the Stripe Customer from the authenticated Llama account
            rather than accept a Checkout Session ID from the browser.
          </p>
        </div>
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        content = (
          <ErrorCard message="Stripe could not find that Checkout Session in this test environment." />
        );
      } else {
        throw error;
      }
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="Llama home">
          <span className={styles.mark} aria-hidden="true">
            L
          </span>
          <span>Llama</span>
        </Link>
        <span className={styles.testBadge}>Stripe test mode</span>
      </header>
      <main className={styles.confirmationWrap}>{content}</main>
    </div>
  );
}
