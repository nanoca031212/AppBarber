-- CreateTable
CREATE TABLE "BarbeiroServico" (
    "barbeiroId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,

    CONSTRAINT "BarbeiroServico_pkey" PRIMARY KEY ("barbeiroId","servicoId")
);

-- AddForeignKey
ALTER TABLE "BarbeiroServico" ADD CONSTRAINT "BarbeiroServico_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "Barbeiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarbeiroServico" ADD CONSTRAINT "BarbeiroServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
