import { prisma } from "@/lib/prisma";

type ServiceItem = { name: string; price: number; duration?: number };

export type CriarReservaInput = {
  clienteId: string;
  barbeiroId: string;
  dateIso: string;
  time: string;
  services: ServiceItem[];
  total: number;
  status?: "PENDENTE" | "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";
};

export async function criarReserva(input: CriarReservaInput) {
  return prisma.reserva.create({
    data: {
      clienteId: input.clienteId,
      barbeiroId: input.barbeiroId,
      data: new Date(input.dateIso),
      horario: input.time,
      total: input.total,
      status: input.status ?? "CONFIRMADO",
      servicos: {
        create: await Promise.all(
          input.services.map(async (s) => {
            const duracao = s.duration && s.duration > 0 ? s.duration : 30;
            const servico =
              (await prisma.servico.findFirst({ where: { nome: s.name } })) ??
              (await prisma.servico.create({
                data: { nome: s.name, preco: s.price, duracao },
              }));
            return { servicoId: servico.id };
          }),
        ),
      },
    },
    include: {
      cliente: { omit: { senha: true } },
      servicos: { include: { servico: true } },
      barbeiro: true,
    },
  });
}
