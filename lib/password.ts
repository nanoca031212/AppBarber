import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(senha: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(senha, salt, 64);
  if (candidate.length !== hashBuffer.length) return false;
  return timingSafeEqual(candidate, hashBuffer);
}

// Sem caracteres ambíguos (0/O, 1/l/I) — a senha é lida por um humano no WhatsApp.
const ALFABETO_SENHA = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function gerarSenhaAleatoria(tamanho = 8): string {
  const bytes = randomBytes(tamanho);
  return Array.from(bytes, (b) => ALFABETO_SENHA[b % ALFABETO_SENHA.length]).join("");
}
