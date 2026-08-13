import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PIXELS_ID = "default";

const DEFAULT_PIXELS = {
  metaPixelId: null,
  metaAtivo: false,
  ga4Id: null,
  ga4Ativo: false,
  tiktokId: null,
  tiktokAtivo: false,
  gtmId: null,
  gtmAtivo: false,
};

export async function GET() {
  const pixels = await prisma.gestorPixels.upsert({
    where: { id: PIXELS_ID },
    update: {},
    create: { id: PIXELS_ID, ...DEFAULT_PIXELS },
  });

  return NextResponse.json(pixels);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const allowed = [
    "metaPixelId", "metaAtivo",
    "ga4Id", "ga4Ativo",
    "tiktokId", "tiktokAtivo",
    "gtmId", "gtmAtivo",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const pixels = await prisma.gestorPixels.upsert({
    where: { id: PIXELS_ID },
    update: data,
    create: { id: PIXELS_ID, ...DEFAULT_PIXELS, ...data },
  });

  return NextResponse.json(pixels);
}
