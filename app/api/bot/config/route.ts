import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.botConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      ativo: false,
      identidade: "",
      contexto: "",
      instrucoes: "",
      restricoes: "",
    },
  });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const config = await prisma.botConfig.upsert({
    where: { id: "default" },
    update: { ...body, updatedAt: new Date() },
    create: {
      id: "default",
      ativo: body.ativo ?? false,
      identidade: body.identidade ?? "",
      contexto: body.contexto ?? "",
      instrucoes: body.instrucoes ?? "",
      restricoes: body.restricoes ?? "",
    },
  });
  return NextResponse.json(config);
}
