import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const barberName = url.searchParams.get("barberName");
  const dataParam = url.searchParams.get("data");

  if (!barberName || !dataParam) {
    return NextResponse.json([]);
  }

  const [year, month, day] = dataParam.split("-").map(Number);
  if (!year || !month || !day) {
    return NextResponse.json([]);
  }

  const reservas = await prisma.reserva.findMany({
    where: {
      barbeiroId: `name:${barberName}`,
      status: { not: "CANCELADO" },
    },
    select: {
      data: true,
      horario: true,
      servicos: { select: { servico: { select: { duracao: true } } } },
    },
  });

  const ocupados = reservas
    .filter(
      (r) =>
        r.data.getFullYear() === year &&
        r.data.getMonth() === month - 1 &&
        r.data.getDate() === day,
    )
    .map((r) => ({
      horario: r.horario,
      duracao:
        r.servicos.reduce((sum, s) => sum + s.servico.duracao, 0) || 30,
    }));

  return NextResponse.json(ocupados);
}
