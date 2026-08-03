import type { Chat, Contact, WAMessage } from "baileys";
import { toClientId } from "./jid";

type ClientChat = {
  id: string;
  name?: string;
  lastMessage?: { body: string };
  timestamp: number;
};

type ClientMessage = {
  id?: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
};

const MAX_MESSAGES_PER_CHAT = 200;

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && typeof (value as any).toNumber === "function") {
    return (value as any).toNumber();
  }
  return Math.floor(Date.now() / 1000);
}

function extractBody(message: WAMessage["message"]): string {
  if (!message) return "";
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage) return message.imageMessage.caption || "📷 Imagem";
  if (message.videoMessage) return message.videoMessage.caption || "🎥 Vídeo";
  if (message.documentMessage) {
    return message.documentMessage.caption || message.documentMessage.fileName || "📄 Documento";
  }
  if (message.audioMessage) return message.audioMessage.ptt ? "🎤 Áudio" : "🎵 Áudio";
  if (message.stickerMessage) return "Figurinha";
  if (message.locationMessage) return "📍 Localização";
  if (message.contactMessage) return "👤 Contato";
  return "";
}

// Cada instância do WhatsApp (uma por barbeiro) precisa da sua própria
// coleção de chats/mensagens — por isso o store é uma fábrica, não módulo
// singleton como antes de suportar múltiplas conexões.
export function createWhatsappStore() {
  const chats = new Map<string, ClientChat>();
  const contactNames = new Map<string, string>();
  const messagesByChat = new Map<string, ClientMessage[]>();

  function upsertChat(jid: string, patch: { name?: string; timestamp?: number }) {
    const existing = chats.get(jid);
    chats.set(jid, {
      id: jid,
      name: patch.name ?? existing?.name,
      lastMessage: existing?.lastMessage,
      timestamp: patch.timestamp ?? existing?.timestamp ?? Math.floor(Date.now() / 1000),
    });
  }

  function rememberContactName(id?: string, name?: string, notify?: string) {
    const resolved = name || notify;
    if (!id || !resolved) return;
    contactNames.set(id, resolved);
    const existingChat = chats.get(id);
    if (existingChat && !existingChat.name) existingChat.name = resolved;
  }

  function recordMessage(m: WAMessage) {
    const jid = m.key.remoteJid;
    if (!jid) return;

    const body = extractBody(m.message);
    const timestamp = toNumber(m.messageTimestamp);

    const list = messagesByChat.get(jid) || [];
    list.push({ id: m.key.id || undefined, body, fromMe: !!m.key.fromMe, timestamp });
    list.sort((a, b) => a.timestamp - b.timestamp);
    if (list.length > MAX_MESSAGES_PER_CHAT) list.splice(0, list.length - MAX_MESSAGES_PER_CHAT);
    messagesByChat.set(jid, list);

    upsertChat(jid, { timestamp });
    if (body) chats.get(jid)!.lastMessage = { body };
  }

  return {
    onHistorySet({
      chats: histChats,
      contacts,
      messages,
    }: {
      chats: Chat[];
      contacts: Contact[];
      messages: WAMessage[];
    }) {
      for (const c of contacts) rememberContactName(c.id, c.name, c.notify);
      for (const c of histChats) {
        if (!c.id) continue;
        upsertChat(c.id, { name: c.name || contactNames.get(c.id), timestamp: toNumber(c.conversationTimestamp) });
      }
      for (const m of messages) recordMessage(m);
    },

    onChatsUpsert(newChats: Chat[]) {
      for (const c of newChats) {
        if (!c.id) continue;
        upsertChat(c.id, { name: c.name || contactNames.get(c.id), timestamp: toNumber(c.conversationTimestamp) });
      }
    },

    onChatsUpdate(updates: Partial<Chat>[]) {
      for (const c of updates) {
        if (!c.id) continue;
        upsertChat(c.id, {
          name: c.name || contactNames.get(c.id),
          timestamp: c.conversationTimestamp !== undefined ? toNumber(c.conversationTimestamp) : undefined,
        });
      }
    },

    onContactsUpsert(newContacts: Contact[]) {
      for (const c of newContacts) rememberContactName(c.id, c.name, c.notify);
    },

    onContactsUpdate(updates: Partial<Contact>[]) {
      for (const c of updates) rememberContactName(c.id, c.name, c.notify);
    },

    onMessagesUpsert({ messages }: { messages: WAMessage[] }) {
      for (const m of messages) recordMessage(m);
    },

    listChats() {
      return Array.from(chats.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((c) => ({ id: toClientId(c.id), name: c.name, lastMessage: c.lastMessage }));
    },

    // Retorna mais recente primeiro, igual ao contrato que o WAHA expunha
    // (o frontend faz .reverse() para exibir em ordem cronológica).
    listMessages(jid: string, limit: number) {
      const list = messagesByChat.get(jid) || [];
      return list.slice(-limit).reverse();
    },
  };
}

export type WhatsappStore = ReturnType<typeof createWhatsappStore>;
