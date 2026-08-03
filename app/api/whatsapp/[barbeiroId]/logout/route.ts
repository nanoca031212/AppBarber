import { NextResponse } from "next/server";
import { logout } from "@/lib/whatsapp/socket";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  try {
    await logout(barbeiroId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao desconectar", detail: String(error) },
      { status: 500 },
    );
  }
}
