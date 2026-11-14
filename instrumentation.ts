// Next.js calls this for every uncaught error in a route, page or server action.
export async function onRequestError(err: unknown, request: { path: string }) {
  // The import must sit inside this check so the Edge bundle drops it (web-push needs Node's crypto).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logError } = await import("@/lib/errors");
    await logError("server", err instanceof Error ? `${err.name}: ${err.message}` : String(err), request.path);
  }
}
