import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: body,
  });

  return new Response("OK");
}
