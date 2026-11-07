// Next.js calls this for every uncaught error in a route, page or server action.
export async function onRequestError(err: unknown, request: { path: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logError } = await import("@/lib/errors");
  await logError("server", err instanceof Error ? `${err.name}: ${err.message}` : String(err), request.path);
}
