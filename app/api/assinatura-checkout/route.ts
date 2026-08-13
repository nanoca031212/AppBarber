import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createCheckout } from "@/lib/asaas";

function withRef(url: string, ref: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}session_id=${ref}`;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { successUrl, cancelUrl } = await req.json();

    const ref = randomUUID();
    await prisma.asaasCheckout.create({
      data: { externalRef: ref, tipo: "ASSINATURA" },
    });

    const checkout = await createCheckout({
      billingTypes: ["CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],
      items: [
        {
          name: "Assinatura Mensal",
          description: "3 cortes por semana",
          value: 99.9,
          quantity: 1,
        },
      ],
      subscription: { cycle: "MONTHLY", nextDueDate: tomorrow() },
      externalReference: ref,
      callback: {
        successUrl: withRef(successUrl, ref),
        cancelUrl,
      },
    });

    await prisma.asaasCheckout.update({
      where: { externalRef: ref },
      data: { checkoutId: checkout.id },
    });

    return NextResponse.json({ url: checkout.link });
  } catch (err) {
    console.error("[assinatura-checkout] Falha ao criar checkout:", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
