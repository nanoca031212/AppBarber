import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ServiceItem = { name: string; price: number };

export async function POST(req: NextRequest) {
  const { clienteId, barberName, services, dateIso, time, total } =
    await req.json();

  const barbeiro = await prisma.barbeiro.upsert({
    where: { id: `name:${barberName}` },
    update: {},
    create: { id: `name:${barberName}`, nome: barberName },
  });

  const reserva = await prisma.reserva.create({
    data: {
      clienteId,
      barbeiroId: barbeiro.id,
      data: new Date(dateIso),
      horario: time,
      total,
      status: "CONFIRMADO",
      servicos: {
        create: await Promise.all(
          services.map(async (s: ServiceItem) => {
            const servico = await prisma.servico.upsert({
              where: { id: `name:${s.name}` },
              update: {},
              create: {
                id: `name:${s.name}`,
                nome: s.name,
                preco: s.price,
                duracao: 30,
              },
            });
            return { servicoId: servico.id };
          }),
        ),
      },
    },
    include: {
      cliente: { omit: { senha: true } },
      servicos: { include: { servico: true } },
      barbeiro: true,
    },
  });

  return NextResponse.json(reserva);
}

export async function GET(req: NextRequest) {
  const clienteId = new URL(req.url).searchParams.get("clienteId");

  const reservas = await prisma.reserva.findMany({
    where: clienteId ? { clienteId } : undefined,
    orderBy: { data: "desc" },
    include: {
      cliente: { omit: { senha: true } },
      servicos: { include: { servico: true } },
      barbeiro: true,
    },
  });

  return NextResponse.json(reservas);
}
