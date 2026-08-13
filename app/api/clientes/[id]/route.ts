import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { nome, email, telefone } = await req.json();

  if (!nome && !email && !telefone) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (nome) data.nome = nome;
  if (email) data.email = email;
  if (telefone) data.telefone = telefone;

  const cliente = await prisma.cliente.update({
    where: { id },
    data,
    omit: { senha: true },
  });

  return NextResponse.json(cliente);
}
