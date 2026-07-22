import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";
import { CREDIT_TOPUP_PRICE_LOOKUP_KEY } from "@/lib/stripe/plans";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const prices = await stripe.prices.list({
    lookup_keys: [CREDIT_TOPUP_PRICE_LOOKUP_KEY],
    limit: 1,
  });
  const priceId = prices.data[0]?.id;
  if (!priceId) {
    return NextResponse.json({ error: "Top-ups aren't configured yet" }, { status: 500 });
  }

  const origin = req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?topup=success`,
    cancel_url: `${origin}/billing?topup=cancelled`,
    client_reference_id: userId,
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    metadata: { userId, type: "credit_topup" },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
