import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";
import { priceLookupKey } from "@/lib/stripe/plans";
import { CheckoutSchema } from "@/lib/validation/billing";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey(parsed.data.plan, parsed.data.cycle)],
    limit: 1,
  });
  const priceId = prices.data[0]?.id;
  if (!priceId) {
    return NextResponse.json({ error: "That plan isn't configured yet" }, { status: 500 });
  }

  const origin = req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    client_reference_id: userId,
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    subscription_data: { metadata: { userId } },
    metadata: { userId, plan: parsed.data.plan, billingCycle: parsed.data.cycle },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
