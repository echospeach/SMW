import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";
import { planFromSubscription } from "@/lib/stripe/plans";
import { grantPaidCredits, PAID_TOPUP_GENERATIONS } from "@/lib/referral";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.userId;

  // One-time credit top-up: a plain payment session, no subscription at all
  // -- branch before the subscription-only extraction below, which would
  // otherwise no-op (harmlessly, but confusingly) for this session type.
  if (session.metadata?.type === "credit_topup") {
    if (!userId) return;
    await grantPaidCredits(userId, PAID_TOPUP_GENERATIONS);
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!userId || !subscriptionId || !customerId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { plan, cycle } = planFromSubscription(subscription);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      billingCycle: cycle,
      ...(plan ? { plan } : {}),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
  if (!user) return;

  const { plan, cycle } = planFromSubscription(subscription);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: subscription.status,
      billingCycle: cycle,
      ...(plan ? { plan } : {}),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "canceled", stripeSubscriptionId: null, plan: "STARTER" },
  });
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
