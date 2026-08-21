const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;

// Nome da instância Evolution API por barbeiro
export function instanceName(barbeiroId: string) {
  return `barbearia-${barbeiroId}`;
}

async function evolutionFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
      ...init?.headers,
    },
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Evolution API: resposta inválida em ${path} (${res.status}): ${raw}`);
  }

  if (!res.ok) {
    const message =
      (data as { message?: string; error?: string })?.message ??
      (data as { error?: string })?.error ??
      `Erro ${res.status} em ${path}`;
    throw new Error(message);
  }

  return data as T;
}

// ─── Instâncias ───────────────────────────────────────────────────────────────

export type EvolutionInstanceStatus = {
  instance: {
    instanceName: string;
    state: "open" | "connecting" | "close";
  };
};

export type EvolutionQrCode = {
  pairingCode: string | null;
  code: string;
  base64: string;
  count: number;
};

export type EvolutionCreateInstance = {
  instance: { instanceName: string; instanceId: string; status: string };
  hash: string;
  qrcode?: EvolutionQrCode;
};

export function createInstance(name: string) {
  return evolutionFetch<EvolutionCreateInstance>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: name,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    }),
  });
}

export function getConnectionState(name: string) {
  return evolutionFetch<EvolutionInstanceStatus>(
    `/instance/connectionState/${name}`,
  );
}

export function connectInstance(name: string) {
  return evolutionFetch<{ base64?: string; code?: string }>(
    `/instance/connect/${name}`,
  );
}

export function getPairingCode(name: string, phoneNumber: string) {
  // phoneNumber: somente dígitos com DDI, ex: "5511999999999"
  const digits = phoneNumber.replace(/\D/g, "");
  return evolutionFetch<{ code?: string; pairingCode?: string }>(
    `/instance/pairing-code/${name}`,
    {
      method: "POST",
      body: JSON.stringify({ number: digits }),
    },
  );
}

export function logoutInstance(name: string) {
  return evolutionFetch<{ ok: boolean }>(`/instance/logout/${name}`, {
    method: "DELETE",
  });
}

export function deleteInstance(name: string) {
  return evolutionFetch<{ ok: boolean }>(`/instance/delete/${name}`, {
    method: "DELETE",
  });
}

// ─── Webhook ──────────────────────────────────────────────────────────────────
// Sem isso configurado na instância, a Evolution API nunca avisa nosso servidor
// quando uma mensagem chega — o bot fica conectado mas "surdo".

export function webhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/webhooks/evolution`;
}

export function setWebhook(name: string) {
  return evolutionFetch<unknown>(`/webhook/set/${name}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl(),
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT"],
      },
    }),
  });
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

export type SendTextResponse = {
  key: { id: string };
  status: string;
};

export function sendText(
  instanceName: string,
  number: string,
  text: string,
) {
  // number: somente dígitos, ex: "5511999999999"
  const digits = number.replace(/\D/g, "");
  return evolutionFetch<SendTextResponse>(
    `/message/sendText/${instanceName}`,
    {
      method: "POST",
      body: JSON.stringify({ number: digits, text }),
    },
  );
}
