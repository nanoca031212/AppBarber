import { NextResponse } from "next/server";
import { createInstance, connectInstance, getConnectionState, instanceName } from "@/lib/evolution";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  const instancia = instanceName(barbeiroId);

  try {
    const state = await getConnectionState(instancia).catch(() => null);
    const currentState = state?.instance?.state ?? "notfound";

    if (currentState === "notfound" || !state) {
      // Instância não existe — cria (já gera QR automaticamente)
      await createInstance(instancia);
    } else if (currentState === "close") {
      // Instância existe mas desconectada — reconecta para gerar novo QR
      await connectInstance(instancia);
    }
    // Se já está "connecting" ou "open", não faz nada

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao iniciar conexão", detail: String(err) },
      { status: 500 },
    );
  }
}
