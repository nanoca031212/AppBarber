import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const servicos = await prisma.servico.findMany({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(servicos);
}

export async function POST(req: NextRequest) {
  const { nome, descricao, preco, duracao, foto, fotoPosicao } =
    await req.json();

  if (!nome) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const servico = await prisma.servico.create({
    data: {
      nome,
      descricao: descricao || null,
      preco: preco ?? 0,
      duracao: duracao ?? 30,
      foto: foto || null,
      fotoPosicao: fotoPosicao || null,
    },
  });

  return NextResponse.json(servico);
}
