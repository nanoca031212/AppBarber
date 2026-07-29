import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from "baileys";
import { Boom } from "@hapi/boom";
import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import {
  onChatsUpdate,
  onChatsUpsert,
  onContactsUpdate,
  onContactsUpsert,
  onHistorySet,
  onMessagesUpsert,
} from "./store";

const SESSION_DIR = process.env.BAILEYS_SESSION_PATH
  ? path.resolve(process.env.BAILEYS_SESSION_PATH)
  : path.join(process.cwd(), "lib", "whatsapp", "session");

const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || "silent" }) as any;

type WhatsappState = {
  sock: WASocket | null;
  currentQr: string | null;
  status: "connecting" | "open" | "close";
  starting: Promise<WASocket> | null;
};

// instrumentation.ts e as rotas de API (app/api/whatsapp/*) acabam em grafos
// de módulo diferentes no bundler do Next (Turbopack/webpack), então um
// simples `let` no topo do arquivo não é compartilhado entre eles — cada um
// enxergaria sua própria cópia "vazia". Guardar em globalThis garante uma
// única instância por processo Node, igual ao truque do singleton do Prisma.
const globalForWhatsapp = globalThis as unknown as {
  __whatsappState?: WhatsappState;
};

const state: WhatsappState = globalForWhatsapp.__whatsappState ?? {
  sock: null,
  currentQr: null,
  status: "connecting",
  starting: null,
};
globalForWhatsapp.__whatsappState = state;

export function getSocket(): WASocket {
  if (!state.sock) throw new Error("Socket do WhatsApp ainda não está pronto");
  return state.sock;
}

export function getQr() {
  return state.currentQr;
}

export function getStatus() {
  return state.status;
}

export function getPhone(): string | null {
  const jid = state.sock?.user?.id;
  if (!jid) return null;
  return jid.split(":")[0].split("@")[0];
}

// Só existe um socket por processo do servidor Next. instrumentation.ts
// chama isto uma vez no boot; se algo tentar chamar de novo enquanto a
// primeira chamada ainda está em andamento, reaproveita a mesma promise.
export function startSocket(): Promise<WASocket> {
  if (state.starting) return state.starting;
  state.starting = connect();
  return state.starting;
}

async function connect(): Promise<WASocket> {
  const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: authState,
    logger,
  });
  state.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.currentQr = qr;
      state.status = "connecting";
      console.log("[whatsapp] Novo QR code disponível em /admin (aba WhatsApp)");
    }

    if (connection === "open") {
      state.currentQr = null;
      state.status = "open";
      console.log("[whatsapp] Conectado ao WhatsApp.");
    }

    if (connection === "close") {
      state.status = "close";
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        console.log("[whatsapp] Sessão desconectada (logout). Gerando novo QR...");
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      } else {
        console.log("[whatsapp] Conexão caiu, reconectando...", statusCode);
      }
      state.starting = null;
      startSocket().catch((err) => console.error("[whatsapp] Falha ao reconectar:", err));
    }
  });

  sock.ev.on("messaging-history.set", onHistorySet);
  sock.ev.on("chats.upsert", onChatsUpsert);
  sock.ev.on("chats.update", onChatsUpdate);
  sock.ev.on("contacts.upsert", onContactsUpsert);
  sock.ev.on("contacts.update", onContactsUpdate);
  sock.ev.on("messages.upsert", onMessagesUpsert);

  return sock;
}

// Encerra a sessão atual no WhatsApp (equivalente a "sair" pelo celular).
// O handler de connection.update acima detecta o loggedOut, limpa a pasta
// de sessão e reinicia o socket automaticamente, gerando um QR novo.
export async function logout(): Promise<void> {
  if (!state.sock) return;
  try {
    await state.sock.logout();
  } catch {
    // conexão já pode estar fechada — o handler de close cuida do resto
  }
}
