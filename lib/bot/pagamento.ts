import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

type ServiceItem = { name: string; price: number; duration?: number };

// Mesmo formato de AsaasCheckout que app/api/checkout-session/route.ts já usa —
// a reserva de verdade só é criada depois, pelo webhook do Asaas quando o
// pagamento é confirmado (app/api/webhooks/asaas/route.ts, já existente).
export async function criarPedidoOnline(input: {
  clienteId: string;
  barberName: string;
  dateIso: string;
  time: string;
  services: ServiceItem[];
}): Promise<string> {
  const ref = randomUUID();

  await prisma.asaasCheckout.create({
    data: {
      externalRef: ref,
      tipo: "SERVICO",
      dadosReserva: {
        services: input.services,
        barberName: input.barberName,
        date: input.dateIso,
        time: input.time,
        clienteId: input.clienteId,
      },
    },
  });

  return ref;
}

export function linkCheckout(ref: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/checkout?ref=${ref}`;
}
