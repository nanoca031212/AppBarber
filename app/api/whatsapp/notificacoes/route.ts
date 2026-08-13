import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CONFIG_ID = "default";

const DEFAULT_CONFIG = {
  confirmacaoAgendamento: true,
  lembreteAgendamento: true,
  horasAntesLembrete: 24,
  avisoCancelamento: true,
};

export async function GET() {
  const config = await prisma.whatsappNotificacaoConfig.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID, ...DEFAULT_CONFIG, updatedAt: new Date() },
  });

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const allowed = [
    "confirmacaoAgendamento",
    "lembreteAgendamento",
    "horasAntesLembrete",
    "avisoCancelamento",
  ];

  const data: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const config = await prisma.whatsappNotificacaoConfig.upsert({
    where: { id: CONFIG_ID },
    update: data,
    create: { id: CONFIG_ID, ...DEFAULT_CONFIG, updatedAt: new Date(), ...data },
  });

  return NextResponse.json(config);
}
