import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No active subscription yet" }, { status: 400 });
  }

  const origin = process.env.APP_URL ?? req.nextUrl.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/billing`,
    configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
  });

  return NextResponse.json({ url: session.url });
}
