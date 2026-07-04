import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CONFIG_ID = "default";

const defaults = {
  id: CONFIG_ID,
  horaInicio: "08:00",
  horaFim: "19:00",
  intervalo: 30,
  pausaAtiva: false,
  pausaInicio: null as string | null,
  pausaFim: null as string | null,
  diasFuncionamento: [1, 2, 3, 4, 5, 6],
};

export async function GET() {
  const config = await prisma.horarioFuncionamento.findUnique({
    where: { id: CONFIG_ID },
  });
  return NextResponse.json(config ?? defaults);
}

export async function PUT(req: NextRequest) {
  const {
    horaInicio,
    horaFim,
    intervalo,
    pausaAtiva,
    pausaInicio,
    pausaFim,
    diasFuncionamento,
  } = await req.json();

  const config = await prisma.horarioFuncionamento.upsert({
    where: { id: CONFIG_ID },
    update: {
      horaInicio,
      horaFim,
      intervalo,
      pausaAtiva,
      pausaInicio,
      pausaFim,
      diasFuncionamento,
    },
    create: {
      id: CONFIG_ID,
      horaInicio,
      horaFim,
      intervalo,
      pausaAtiva,
      pausaInicio,
      pausaFim,
      diasFuncionamento,
    },
  });

  return NextResponse.json(config);
}
