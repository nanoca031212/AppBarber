import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/checkout-session/[id]">,
) {
  const { id } = await ctx.params;
  const checkout = await prisma.asaasCheckout.findUnique({
    where: { externalRef: id },
  });

  return NextResponse.json({
    status: checkout?.status ?? "PENDING",
    nome: checkout?.nome ?? "",
    email: checkout?.email ?? "",
    phone: checkout?.telefone ?? "",
    dadosReserva: checkout?.dadosReserva ?? null,
  });
}
