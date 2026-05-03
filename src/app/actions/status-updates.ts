"use server";

import { StatusUpdateType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = new Set<StatusUpdateType>([
  "KNOWN_ISSUE",
  "INCIDENT",
  "FIX",
  "PRODUCT_UPDATE",
]);

function readString(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readType(formData: FormData): StatusUpdateType {
  const raw = readString(formData, "type", "KNOWN_ISSUE") as StatusUpdateType;
  return VALID_TYPES.has(raw) ? raw : "KNOWN_ISSUE";
}

function redirectBack() {
  revalidatePath("/admin/status-updates");
  revalidatePath("/updates");
  redirect("/admin/status-updates");
}

export async function saveStatusUpdate(formData: FormData) {
  const admin = await requireAdmin();

  const id = readString(formData, "id");
  const intent = readString(formData, "intent", "save");
  const title = readString(formData, "title");
  const summary = readString(formData, "summary");

  if (!title || !summary) {
    throw new Error("Title and summary are required");
  }

  const shouldPublish = intent === "publish" || formData.get("isPublished") === "on";
  const data = {
    type: readType(formData),
    title,
    summary,
    body: readString(formData, "body") || null,
    publicStatus: readString(formData, "publicStatus", "Investigating"),
    severity: readString(formData, "severity", "Informational"),
    sourceType: readString(formData, "sourceType") || null,
    sourceId: readString(formData, "sourceId") || null,
    sourceUrl: readString(formData, "sourceUrl") || null,
    isPublished: shouldPublish,
    publishedAt: shouldPublish ? new Date() : null,
    archivedAt: null,
    updatedById: admin.id,
  };

  if (id) {
    const existing = await prisma.statusUpdate.findUnique({ where: { id } });
    await prisma.statusUpdate.update({
      where: { id },
      data: {
        ...data,
        publishedAt: shouldPublish ? existing?.publishedAt ?? new Date() : null,
      },
    });
  } else {
    await prisma.statusUpdate.create({
      data: {
        ...data,
        createdById: admin.id,
      },
    });
  }

  redirectBack();
}

export async function setStatusUpdatePublication(formData: FormData) {
  const admin = await requireAdmin();
  const id = readString(formData, "id");
  const intent = readString(formData, "intent");

  if (!id) throw new Error("Status update id is required");

  if (intent === "publish") {
    const existing = await prisma.statusUpdate.findUnique({ where: { id } });
    await prisma.statusUpdate.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: existing?.publishedAt ?? new Date(),
        archivedAt: null,
        updatedById: admin.id,
      },
    });
  } else if (intent === "unpublish") {
    await prisma.statusUpdate.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
        updatedById: admin.id,
      },
    });
  } else if (intent === "archive") {
    await prisma.statusUpdate.update({
      where: { id },
      data: {
        isPublished: false,
        archivedAt: new Date(),
        updatedById: admin.id,
      },
    });
  }

  redirectBack();
}
