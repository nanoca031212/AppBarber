// O frontend (herdado do WAHA/whatsapp-web.js) espera IDs de contato no
// formato "<numero>@c.us". O Baileys usa "<numero>@s.whatsapp.net" para
// contatos individuais (grupos já usam "@g.us" nos dois). Estas funções
// traduzem entre os dois formatos para manter o mesmo contrato de dados.

export function toBaileysJid(id: string): string {
  if (id.endsWith("@g.us") || id.endsWith("@s.whatsapp.net") || id.endsWith("@lid")) {
    return id;
  }
  if (id.endsWith("@c.us")) {
    return id.replace("@c.us", "@s.whatsapp.net");
  }
  const digits = id.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}

export function toClientId(jid: string): string {
  if (jid.endsWith("@s.whatsapp.net")) {
    return jid.replace("@s.whatsapp.net", "@c.us");
  }
  return jid;
}
