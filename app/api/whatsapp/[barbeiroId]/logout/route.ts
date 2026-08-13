import { NextResponse } from "next/server";
import { logoutInstance, instanceName } from "@/lib/evolution";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  const instancia = instanceName(barbeiroId);

  try {
    await logoutInstance(instancia);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao desconectar", detail: String(err) },
      { status: 500 },
    );
  }
}
