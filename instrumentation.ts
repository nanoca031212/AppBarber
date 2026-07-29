export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSocket } = await import("./lib/whatsapp/socket");
    startSocket().catch((err) => {
      console.error("[whatsapp] Falha ao iniciar conexão:", err);
    });
  }
}
