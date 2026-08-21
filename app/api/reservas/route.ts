import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarReserva } from "@/lib/reservas";

export async function POST(req: NextRequest) {
  const { clienteId, barberName, services, dateIso, time, total } =
    await req.json();

  const barbeiro =
    (await prisma.barbeiro.findFirst({ where: { nome: barberName } })) ??
    (await prisma.barbeiro.create({ data: { nome: barberName } }));

  const reserva = await criarReserva({
    clienteId,
    barbeiroId: barbeiro.id,
    dateIso,
    time,
    services,
    total,
    status: "CONFIRMADO",
  });

  return NextResponse.json(reserva);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clienteId = url.searchParams.get("clienteId");
  const data = url.searchParams.get("data"); // ex: "2025-08-12" — filtro do admin

  const where: Record<string, unknown> = {};
  if (clienteId) where.clienteId = clienteId;
  if (data) {
    const d = new Date(data);
    const fim = new Date(data);
    fim.setDate(fim.getDate() + 1);
    where.data = { gte: d, lt: fim };
  }

  const reservas = await prisma.reserva.findMany({
    where,
    orderBy: { data: "desc" },
    include: {
      cliente: { omit: { senha: true } },
      servicos: { include: { servico: true } },
      barbeiro: true,
    },
  });

  return NextResponse.json(reservas);
}
