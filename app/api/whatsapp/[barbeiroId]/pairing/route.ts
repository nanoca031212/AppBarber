import { NextRequest, NextResponse } from "next/server";
import {
  createInstance,
  connectInstance,
  getConnectionState,
  getPairingCode,
  instanceName,
} from "@/lib/evolution";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  const instancia = instanceName(barbeiroId);
  const { telefone } = await req.json();

  if (!telefone) {
    return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
  }

  try {
    const state = await getConnectionState(instancia).catch(() => null);
    const currentState = state?.instance?.state ?? "notfound";

    // Precisa estar em estado "connecting" para o pairing code funcionar
    if (!state || currentState === "notfound") {
      await createInstance(instancia);
    } else if (currentState === "close") {
      await connectInstance(instancia);
    }
    // Se já está "connecting", não precisa fazer nada

    const data = await getPairingCode(instancia, telefone);
    const code = data?.pairingCode ?? data?.code ?? null;

    if (!code) {
      return NextResponse.json(
        { error: "Código não gerado. Aguarde alguns segundos e tente novamente." },
        { status: 503 },
      );
    }

    return NextResponse.json({ code });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao gerar código", detail: String(err) },
      { status: 500 },
    );
  }
}
