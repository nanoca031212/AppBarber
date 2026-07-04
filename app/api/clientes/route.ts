import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const { nome, email, telefone, senha } = await req.json();

  if (!nome || !telefone) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
  }

  const senhaHash = senha ? hashPassword(senha) : undefined;

  const cliente = await prisma.cliente.upsert({
    where: { email: email ?? "" },
    update: { nome, telefone, ...(senhaHash ? { senha: senhaHash } : {}) },
    create: { nome, email: email || null, telefone, senha: senhaHash },
  });

  const { senha: _senha, ...clienteSemSenha } = cliente;
  return NextResponse.json(clienteSemSenha);
}

export async function GET() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { createdAt: "desc" },
    omit: { senha: true },
  });
  return NextResponse.json(clientes);
}
