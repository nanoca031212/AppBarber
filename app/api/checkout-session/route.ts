import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

type ServiceItem = { name: string; price: number };

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!);
  try {
    const { services, barberName, date, time, successUrl, cancelUrl } =
      await req.json();

    const lineItems = services.map((s: ServiceItem) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: s.name,
          description: `Barbeiro: ${barberName}${date ? ` • ${date}` : ""}${time ? ` • ${time}` : ""}`,
        },
        unit_amount: Math.round(s.price * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      phone_number_collection: { enabled: true },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
