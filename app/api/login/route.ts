import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { email } });

  if (!cliente || !cliente.senha || !verifyPassword(senha, cliente.senha)) {
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
  }

  const { senha: _senha, ...clienteSemSenha } = cliente;
  return NextResponse.json(clienteSemSenha);
}
