import { NextResponse, type NextRequest } from "next/server";

// The native app (and its web preview) call the API with a Bearer token from another origin.
// No cookies are allowed cross-origin, so "*" can't be used to ride on someone's website session.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: CORS });
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

export const config = { matcher: ["/api/((?!auth/).*)"] };
