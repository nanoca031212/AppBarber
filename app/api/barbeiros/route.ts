import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const barbeiros = await prisma.barbeiro.findMany({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
    include: { servicos: { select: { servicoId: true } } },
  });
  return NextResponse.json(
    barbeiros.map((b) => ({
      ...b,
      serviceIds: b.servicos.map((s) => s.servicoId),
    })),
  );
}

export async function POST(req: NextRequest) {
  const { nome, descricao, foto, fotoPosicao, serviceIds } = await req.json();

  if (!nome) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const barbeiro = await prisma.barbeiro.create({
    data: {
      nome,
      descricao: descricao || null,
      foto: foto || null,
      fotoPosicao: fotoPosicao || null,
      servicos: {
        create: ((serviceIds ?? []) as string[]).map((servicoId) => ({
          servicoId,
        })),
      },
    },
    include: { servicos: { select: { servicoId: true } } },
  });

  return NextResponse.json({
    ...barbeiro,
    serviceIds: barbeiro.servicos.map((s) => s.servicoId),
  });
}
