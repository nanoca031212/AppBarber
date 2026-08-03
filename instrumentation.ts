export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSocket, listSavedInstanceIds } = await import(
      "./lib/whatsapp/socket"
    );
    for (const instanceId of listSavedInstanceIds()) {
      startSocket(instanceId).catch((err) => {
        console.error(`[whatsapp:${instanceId}] Falha ao iniciar conexão:`, err);
      });
    }
  }
}
