import Stripe from "stripe";

/**
 * Lazily create a Stripe client. Returns null when the secret key is not
 * configured so the app builds and runs without crashing (the checkout route
 * then responds with a friendly message instead of a 500).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}
