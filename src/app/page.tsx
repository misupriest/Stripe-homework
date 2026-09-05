import Link from "next/link";
import styles from "./page.module.css";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const checkoutMessages: Record<string, string> = {
  cancelled: "Checkout was cancelled. Your card was not charged.",
  unavailable:
    "Checkout is temporarily unavailable. Please try again in a moment.",
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const checkoutState =
    typeof params.checkout === "string" ? params.checkout : undefined;
  const checkoutMessage = checkoutState
    ? checkoutMessages[checkoutState]
    : undefined;

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

      <main className={styles.main}>
        {checkoutMessage ? (
          <div className={styles.notice} role="status">
            {checkoutMessage}
          </div>
        ) : null}

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Llama Plus</p>
            <h1>A travel plan that keeps up.</h1>
            <p className={styles.lede}>
              Turn scattered confirmations, ideas, and changes into one calm,
              shareable itinerary.
            </p>
            <div className={styles.signalRow} aria-label="Plan benefits">
              <span>Built for every trip</span>
              <span>Cancel anytime</span>
              <span>Secure checkout</span>
            </div>
          </div>

          <aside className={styles.planCard} aria-labelledby="plan-title">
            <div className={styles.planHeader}>
              <div>
                <p className={styles.planLabel}>Monthly plan</p>
                <h2 id="plan-title">Plus</h2>
              </div>
              <p className={styles.price}>
                <span>$8</span>
                <small>USD / month</small>
              </p>
            </div>

            <ul className={styles.featureList}>
              <li>Unlimited trip itineraries</li>
              <li>Live flight and rail disruption checks</li>
              <li>Collaborative plans for every traveler</li>
            </ul>

            <form action="/api/checkout" method="post">
              <button className={styles.primaryButton} type="submit">
                Continue to secure checkout
              </button>
            </form>

            <p className={styles.paymentNote}>
              Stripe Checkout shows payment methods eligible for your location
              and this recurring USD plan.
            </p>
          </aside>
        </section>

        <section className={styles.testPanel} aria-labelledby="test-heading">
          <div>
            <p className={styles.eyebrow}>Public demo</p>
            <h2 id="test-heading">No real payment is taken</h2>
          </div>
          <p>
            On the Stripe page, use card number{" "}
            <code>4242 4242 4242 4242</code>, any future expiry date, and any
            CVC. Use a test email address.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Llama Inc. subscription prototype</span>
      </footer>
    </div>
  );
}
