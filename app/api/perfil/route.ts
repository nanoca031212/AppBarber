import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PERFIL_ID = "default";

const defaults = {
  id: PERFIL_ID,
  nomeBarbearia: "Fabio Barber",
  endereco: null as string | null,
  telefone: null as string | null,
  barbeiroNome: "Fabio",
  barbeiroDescricao: null as string | null,
  barbeiroFoto: null as string | null,
};

export async function GET() {
  const perfil = await prisma.perfilNegocio.findUnique({
    where: { id: PERFIL_ID },
  });
  return NextResponse.json(perfil ?? defaults);
}

export async function PUT(req: NextRequest) {
  const {
    nomeBarbearia,
    endereco,
    telefone,
    barbeiroNome,
    barbeiroDescricao,
    barbeiroFoto,
  } = await req.json();

  const data = {
    nomeBarbearia,
    endereco,
    telefone,
    barbeiroNome,
    barbeiroDescricao,
    barbeiroFoto,
  };

  const perfil = await prisma.perfilNegocio.upsert({
    where: { id: PERFIL_ID },
    update: data,
    create: { id: PERFIL_ID, ...data },
  });

  return NextResponse.json(perfil);
}
