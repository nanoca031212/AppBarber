import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const barbeiros = await prisma.barbeiro.findMany({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(barbeiros);
}

export async function POST(req: NextRequest) {
  const { nome, descricao, foto } = await req.json();

  if (!nome) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const barbeiro = await prisma.barbeiro.create({
    data: { nome, descricao: descricao || null, foto: foto || null },
  });

  return NextResponse.json(barbeiro);
}
