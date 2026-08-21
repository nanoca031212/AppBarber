import { prisma } from "@/lib/prisma";
import { sendText } from "@/lib/evolution";
import { getTemplateMensagem, preencherTemplate, type TemplateVars } from "@/lib/whatsapp/send";

// Envia uma mensagem de template pela mesma instância Evolution em que a
// mensagem do cliente chegou (em vez de derivar a instância por barbeiroId),
// já que o fluxo do bot não está necessariamente atrelado a um barbeiro fixo.
export async function enviarTemplateBot(
  instancia: string,
  telefone: string,
  templateId: string,
  vars: TemplateVars,
): Promise<string | null> {
  const mensagem = await getTemplateMensagem(templateId);
  if (!mensagem) {
    console.warn(`[bot/enviar] Template "${templateId}" não encontrado.`);
    return null;
  }

  const texto = preencherTemplate(mensagem, vars);

  await sendText(instancia, telefone, texto);
  await prisma.botMensagem.create({
    data: { telefone, role: "model", conteudo: texto },
  });

  return texto;
}
