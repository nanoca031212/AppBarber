import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

type ServiceItem = { name: string; price: number };

export async function POST(req: NextRequest) {
  try {
    const { services, barberName, date, time, clienteId } = await req.json();

    const ref = randomUUID();
    await prisma.asaasCheckout.create({
      data: {
        externalRef: ref,
        tipo: "SERVICO",
        dadosReserva: {
          services,
          barberName,
          date,
          time,
          clienteId: clienteId ?? null,
        },
      },
    });

    return NextResponse.json({ ref });
  } catch (err) {
    console.error("[checkout-session] Falha ao criar sessão:", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
