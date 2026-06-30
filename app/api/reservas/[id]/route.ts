import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { status } = await req.json();

  const reserva = await prisma.reserva.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(reserva);
}
