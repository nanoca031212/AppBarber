import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { nome, descricao, preco, duracao, foto, fotoPosicao } =
    await req.json();

  const servico = await prisma.servico.update({
    where: { id },
    data: {
      nome,
      descricao: descricao || null,
      preco,
      duracao,
      foto: foto || null,
      fotoPosicao: fotoPosicao || null,
    },
  });

  return NextResponse.json(servico);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const servico = await prisma.servico.update({
    where: { id },
    data: { ativo: false },
  });

  return NextResponse.json(servico);
}
