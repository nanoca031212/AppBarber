import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!);

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/checkout-session/[id]">,
) {
  const { id } = await ctx.params;
  const session = await stripe.checkout.sessions.retrieve(id);
  const details = session.customer_details;

  return NextResponse.json({
    name: details?.name ?? "",
    email: details?.email ?? "",
    phone: details?.phone ?? "",
  });
}
