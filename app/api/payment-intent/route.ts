import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!);
  const { amount } = await req.json();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "brl",
    automatic_payment_methods: { enabled: true },
  });
  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
