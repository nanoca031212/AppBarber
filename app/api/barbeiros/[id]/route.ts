import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { nome, descricao, foto } = await req.json();

  const barbeiro = await prisma.barbeiro.update({
    where: { id },
    data: { nome, descricao: descricao || null, foto: foto || null },
  });

  return NextResponse.json(barbeiro);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const barbeiro = await prisma.barbeiro.update({
    where: { id },
    data: { ativo: false },
  });

  return NextResponse.json(barbeiro);
}
