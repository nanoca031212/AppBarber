import { prisma } from "@/lib/prisma";
import { sendText, instanceName, getConnectionState } from "@/lib/evolution";

export type TemplateVars = {
  cliente?: string;
  barbearia?: string;
  data?: string;
  horario?: string;
  servico?: string;
  duracao?: string;
  preco?: string;
  link?: string;
};

function preencherTemplate(mensagem: string, vars: TemplateVars): string {
  return mensagem
    .replace(/\{\{cliente\}\}/g, vars.cliente ?? "")
    .replace(/\{\{barbearia\}\}/g, vars.barbearia ?? "")
    .replace(/\{\{data\}\}/g, vars.data ?? "")
    .replace(/\{\{horario\}\}/g, vars.horario ?? "")
    .replace(/\{\{servico\}\}/g, vars.servico ?? "")
    .replace(/\{\{duracao\}\}/g, vars.duracao ?? "")
    .replace(/\{\{preco\}\}/g, vars.preco ?? "")
    .replace(/\{\{link\}\}/g, vars.link ?? "");
}

async function getTemplate(templateId: string): Promise<string | null> {
  const t = await prisma.whatsappTemplate.findUnique({ where: { id: templateId } });
  return t?.mensagem ?? null;
}

export async function enviarMensagemTemplate(
  barbeiroId: string,
  telefone: string,
  templateId: string,
  vars: TemplateVars,
): Promise<boolean> {
  try {
    const mensagem = await getTemplate(templateId);
    if (!mensagem) {
      console.warn(`[whatsapp/send] Template "${templateId}" não encontrado.`);
      return false;
    }

    const instancia = instanceName(barbeiroId);

    // Verifica se a instância está conectada
    const state = await getConnectionState(instancia).catch(() => null);
    if (state?.instance?.state !== "open") {
      console.warn(`[whatsapp/send] Instância ${instancia} não está conectada (state: ${state?.instance?.state ?? "desconhecido"}).`);
      return false;
    }

    // Garante DDI 55 (Brasil) se o número não tiver
    const digits = telefone.replace(/\D/g, "");
    const numeroNormalizado = digits.startsWith("55") ? digits : `55${digits}`;

    const texto = preencherTemplate(mensagem, vars);
    await sendText(instancia, numeroNormalizado, texto);
    return true;
  } catch (err) {
    console.error(`[whatsapp/send] Erro ao enviar template "${templateId}":`, err);
    return false;
  }
}
