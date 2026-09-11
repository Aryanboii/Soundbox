"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

const createListSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
});

export async function createList(input: unknown) {
  const userId = await requireUserId();
  const data = createListSchema.parse(input);
  const list = await db.musicList.create({ data: { userId, ...data } });
  revalidatePath("/lists");
  return list;
}

export async function updateListVisibility(listId: string, visibility: "PUBLIC" | "UNLISTED" | "PRIVATE") {
  const userId = await requireUserId();
  const { count } = await db.musicList.updateMany({
    where: { id: listId, userId }, // ownership check baked into the filter
    data: { visibility },
  });
  if (count === 0) throw new Error("List not found or you don't own it.");
  revalidatePath(`/lists/${listId}`);
}

export async function addAlbumToList(listId: string, albumId: string) {
  const userId = await requireUserId();
  const list = await db.musicList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list || list.userId !== userId) throw new Error("List not found or you don't own it.");

  const maxPosition = await db.listItem.aggregate({
    where: { listId },
    _max: { position: true },
  });

  const item = await db.listItem.upsert({
    where: { listId_albumId: { listId, albumId } },
    create: { listId, albumId, position: (maxPosition._max.position ?? -1) + 1 },
    update: {}, // already in the list — no-op, not an error
  });

  revalidatePath(`/lists/${listId}`);
  return item;
}

export async function removeAlbumFromList(listId: string, albumId: string) {
  const userId = await requireUserId();
  const list = await db.musicList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list || list.userId !== userId) throw new Error("List not found or you don't own it.");

  await db.listItem.deleteMany({ where: { listId, albumId } });
  revalidatePath(`/lists/${listId}`);
}

/** Reorders in one transaction so a partial write never leaves duplicate positions. */
export async function reorderList(listId: string, orderedAlbumIds: string[]) {
  const userId = await requireUserId();
  const list = await db.musicList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list || list.userId !== userId) throw new Error("List not found or you don't own it.");

  await db.$transaction(
    orderedAlbumIds.map((albumId, index) =>
      db.listItem.update({
        where: { listId_albumId: { listId, albumId } },
        data: { position: index },
      }),
    ),
  );

  revalidatePath(`/lists/${listId}`);
}

export async function toggleListLike(listId: string) {
  const userId = await requireUserId();
  const existing = await db.like.findUnique({ where: { userId_listId: { userId, listId } } });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await db.like.create({ data: { userId, listId } });

  const list = await db.musicList.findUnique({ where: { id: listId }, select: { userId: true } });
  if (list && list.userId !== userId) {
    await db.notification.create({
      data: { recipientId: list.userId, actorId: userId, type: "LIST_LIKE", listId },
    });
  }

  return { liked: true };
}
