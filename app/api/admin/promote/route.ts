import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (email) {
    await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });
  }
  return new Response("Admin promoted");
}
