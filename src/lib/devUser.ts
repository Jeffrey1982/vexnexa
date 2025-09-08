import { prisma } from "@/lib/prisma";

export async function getDevUser() {
  const email = process.env.DEV_USER_EMAIL ?? "dev@tutusporta.local";
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}