import { prisma } from "@/lib/prisma";

export async function listarServicosBarbeiro(barbeiroId: string) {
  const vinculos = await prisma.barbeiroServico.findMany({
    where: { barbeiroId, servico: { ativo: true } },
    include: { servico: true },
  });
  return vinculos.map((v) => v.servico);
}

type Servico = Awaited<ReturnType<typeof listarServicosBarbeiro>>[number];

function fmtPreco(preco: number): string {
  return preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarListaServicos(servicos: Servico[]): string {
  return servicos
    .map((s, i) => `${i + 1}. ${s.nome} - ${s.duracao}min - ${fmtPreco(s.preco)}`)
    .join("\n");
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function matchServico(texto: string, servicos: Servico[]): Servico | null {
  const t = normalizar(texto);

  const numero = t.match(/^\D*(\d{1,2})\D*$/);
  if (numero) {
    const indice = Number(numero[1]) - 1;
    if (indice >= 0 && indice < servicos.length) return servicos[indice];
  }

  const porNome = servicos.find((s) => {
    const nome = normalizar(s.nome);
    return t.includes(nome) || nome.includes(t);
  });

  return porNome ?? null;
}
