import { prisma } from "@/lib/prisma";

export async function listarBarbeirosAtivos() {
  return prisma.barbeiro.findMany({
    where: { ativo: true },
    orderBy: { createdAt: "asc" },
  });
}

type Barbeiro = Awaited<ReturnType<typeof listarBarbeirosAtivos>>[number];

export function formatarListaBarbeiros(barbeiros: Barbeiro[]): string {
  return barbeiros.map((b, i) => `${i + 1}. ${b.nome}`).join("\n");
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function matchBarbeiro(texto: string, barbeiros: Barbeiro[]): Barbeiro | null {
  const t = normalizar(texto);

  const numero = t.match(/\d+/);
  if (numero) {
    const indice = Number(numero[0]) - 1;
    if (indice >= 0 && indice < barbeiros.length) return barbeiros[indice];
  }

  const porNome = barbeiros.find((b) => {
    const nome = normalizar(b.nome);
    return t.includes(nome) || nome.includes(t);
  });

  return porNome ?? null;
}
