import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dias = await prisma.horarioDiaPersonalizado.findMany();
  return NextResponse.json(dias);
}

export async function PUT(req: NextRequest) {
  const {
    diaSemana,
    horaInicio,
    horaFim,
    pausaAtiva,
    pausaInicio,
    pausaFim,
  } = await req.json();

  const dia = await prisma.horarioDiaPersonalizado.upsert({
    where: { diaSemana },
    update: { horaInicio, horaFim, pausaAtiva, pausaInicio, pausaFim },
    create: {
      diaSemana,
      horaInicio,
      horaFim,
      pausaAtiva,
      pausaInicio,
      pausaFim,
    },
  });

  return NextResponse.json(dia);
}

export async function DELETE(req: NextRequest) {
  const diaSemana = Number(new URL(req.url).searchParams.get("diaSemana"));

  await prisma.horarioDiaPersonalizado.deleteMany({
    where: { diaSemana },
  });

  return NextResponse.json({ ok: true });
}
