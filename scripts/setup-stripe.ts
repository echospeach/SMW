// One-time (idempotent) setup: creates the Stripe Products/Prices/billing-portal
// configuration that the app's checkout and portal routes look up at runtime.
// Run with: npx tsx scripts/setup-stripe.ts
import "dotenv/config";
import { stripe } from "../src/lib/stripe/client";
import {
  CREDIT_TOPUP_PRICE_LOOKUP_KEY,
  CREDIT_TOPUP_PRODUCT_ID,
  STRIPE_PRODUCT_ID,
  priceLookupKey,
} from "../src/lib/stripe/plans";
import { PLANS } from "../src/lib/theme";
import type Stripe from "stripe";

async function ensureProduct(productId: string, name: string): Promise<Stripe.Product> {
  try {
    const existing = await stripe.products.retrieve(productId);
    console.log(`Product ${productId} already exists`);
    return existing;
  } catch (err) {
    if (
      !(err instanceof stripe.errors.StripeInvalidRequestError) ||
      err.code !== "resource_missing"
    ) {
      throw err;
    }
  }
  const product = await stripe.products.create({ id: productId, name });
  console.log(`Created product ${productId}`);
  return product;
}

async function ensurePrice(
  productId: string,
  lookupKey: string,
  unitAmount: number,
  interval: "month" | "year",
): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) {
    console.log(`Price ${lookupKey} already exists`);
    return existing.data[0];
  }
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: { interval },
    lookup_key: lookupKey,
  });
  console.log(`Created price ${lookupKey} (${unitAmount / 100}/${interval})`);
  return price;
}

async function ensureOneTimePrice(
  productId: string,
  lookupKey: string,
  unitAmount: number,
): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) {
    console.log(`Price ${lookupKey} already exists`);
    return existing.data[0];
  }
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    lookup_key: lookupKey,
  });
  console.log(`Created one-time price ${lookupKey} (${unitAmount / 100})`);
  return price;
}

async function main() {
  const priceIdsByProduct: Record<string, string[]> = {};

  for (const plan of PLANS) {
    const productId = STRIPE_PRODUCT_ID[plan.id];
    const product = await ensureProduct(productId, plan.name);
    const monthly = await ensurePrice(
      product.id,
      priceLookupKey(plan.id, "monthly"),
      plan.monthly * 100,
      "month",
    );
    const yearly = await ensurePrice(
      product.id,
      priceLookupKey(plan.id, "yearly"),
      plan.yearly * 100,
      "year",
    );
    priceIdsByProduct[product.id] = [monthly.id, yearly.id];
  }

  const topupProduct = await ensureProduct(CREDIT_TOPUP_PRODUCT_ID, "10 AI Generations (one-time)");
  await ensureOneTimePrice(topupProduct.id, CREDIT_TOPUP_PRICE_LOOKUP_KEY, 500);

  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Manage your SMW subscription" },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: Object.entries(priceIdsByProduct).map(([product, prices]) => ({
          product,
          prices,
        })),
      },
    },
  });
  console.log(`\nCreated billing portal configuration: ${configuration.id}`);
  console.log("\nAdd this to your env vars:");
  console.log(`STRIPE_PORTAL_CONFIGURATION_ID="${configuration.id}"`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
