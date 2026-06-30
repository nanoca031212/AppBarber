import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { nome, email, telefone } = await req.json();

  if (!nome || !telefone) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
  }

  const cliente = await prisma.cliente.upsert({
    where: { email: email ?? "" },
    update: { nome, telefone },
    create: { nome, email: email || null, telefone },
  });

  return NextResponse.json(cliente);
}

export async function GET() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clientes);
}
