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
import { createWhatsappStore } from "./store";

const SESSION_ROOT = process.env.BAILEYS_SESSION_PATH
  ? path.resolve(process.env.BAILEYS_SESSION_PATH)
  : path.join(process.cwd(), "lib", "whatsapp", "session");

const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || "silent" }) as any;

type WhatsappInstance = {
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
// Cada barbeiro tem sua própria sessão do WhatsApp, por isso o estado é
// indexado por instanceId (o id do barbeiro) em vez de um único objeto.
const globalForWhatsapp = globalThis as unknown as {
  __whatsappInstances?: Map<string, WhatsappInstance>;
};

const instances = globalForWhatsapp.__whatsappInstances ?? new Map();
globalForWhatsapp.__whatsappInstances = instances;

function sessionDir(instanceId: string) {
  return path.join(SESSION_ROOT, instanceId);
}

function getInstance(instanceId: string): WhatsappInstance {
  let inst = instances.get(instanceId);
  if (!inst) {
    inst = { sock: null, currentQr: null, status: "close", starting: null };
    instances.set(instanceId, inst);
  }
  return inst;
}

// Sessões salvas em disco de conexões anteriores — usado no boot para
// reconectar automaticamente as instâncias que já estavam ativas.
export function listSavedInstanceIds(): string[] {
  try {
    return fs
      .readdirSync(SESSION_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export function isStarted(instanceId: string) {
  return instances.has(instanceId);
}

export function getQr(instanceId: string) {
  return instances.get(instanceId)?.currentQr ?? null;
}

export function getStatus(instanceId: string): WhatsappInstance["status"] {
  return instances.get(instanceId)?.status ?? "close";
}

export function getPhone(instanceId: string): string | null {
  const jid = instances.get(instanceId)?.sock?.user?.id;
  if (!jid) return null;
  return jid.split(":")[0].split("@")[0];
}

// Só existe um socket por instância por processo do servidor Next.
// instrumentation.ts chama isto no boot para cada sessão salva; a rota de
// "conectar" chama para iniciar uma instância nova sob demanda. Se algo
// tentar chamar de novo enquanto a primeira chamada ainda está em
// andamento, reaproveita a mesma promise.
export function startSocket(instanceId: string): Promise<WASocket> {
  const inst = getInstance(instanceId);
  if (inst.starting) return inst.starting;
  inst.starting = connect(instanceId, inst);
  return inst.starting;
}

async function connect(
  instanceId: string,
  inst: WhatsappInstance,
): Promise<WASocket> {
  const { state: authState, saveCreds } = await useMultiFileAuthState(
    sessionDir(instanceId),
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: authState,
    logger,
  });
  inst.sock = sock;
  inst.status = "connecting";

  const store = createWhatsappStore();

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      inst.currentQr = qr;
      inst.status = "connecting";
      console.log(
        `[whatsapp:${instanceId}] Novo QR code disponível em /admin (aba WhatsApp)`,
      );
    }

    if (connection === "open") {
      inst.currentQr = null;
      inst.status = "open";
      console.log(`[whatsapp:${instanceId}] Conectado ao WhatsApp.`);
    }

    if (connection === "close") {
      inst.status = "close";
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
        ?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        console.log(
          `[whatsapp:${instanceId}] Sessão desconectada (logout). Gerando novo QR...`,
        );
        fs.rmSync(sessionDir(instanceId), { recursive: true, force: true });
      } else {
        console.log(
          `[whatsapp:${instanceId}] Conexão caiu, reconectando...`,
          statusCode,
        );
      }
      inst.starting = null;
      startSocket(instanceId).catch((err) =>
        console.error(`[whatsapp:${instanceId}] Falha ao reconectar:`, err),
      );
    }
  });

  sock.ev.on("messaging-history.set", store.onHistorySet);
  sock.ev.on("chats.upsert", store.onChatsUpsert);
  sock.ev.on("chats.update", store.onChatsUpdate);
  sock.ev.on("contacts.upsert", store.onContactsUpsert);
  sock.ev.on("contacts.update", store.onContactsUpdate);
  sock.ev.on("messages.upsert", store.onMessagesUpsert);

  return sock;
}

// Encerra a sessão de uma instância no WhatsApp (equivalente a "sair" pelo
// celular). O handler de connection.update acima detecta o loggedOut, limpa
// a pasta de sessão e reinicia o socket automaticamente, gerando um QR novo.
export async function logout(instanceId: string): Promise<void> {
  const inst = instances.get(instanceId);
  if (!inst?.sock) return;
  try {
    await inst.sock.logout();
  } catch {
    // conexão já pode estar fechada — o handler de close cuida do resto
  }
}
