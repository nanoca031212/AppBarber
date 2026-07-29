import { NextResponse } from "next/server";
import { logout } from "@/lib/whatsapp/socket";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao desconectar", detail: String(error) },
      { status: 500 },
    );
  }
}
