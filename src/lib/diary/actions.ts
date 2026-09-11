"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { createDiaryEntrySchema } from "@/lib/validation/rating";

export async function logDiaryEntry(input: unknown) {
  const userId = await requireUserId();
  const data = createDiaryEntrySchema.parse(input);

  const entry = await db.diaryEntry.create({
    data: { userId, ...data },
  });

  // A diary log is also a listening event, for future stats aggregation.
  await db.listeningEvent.create({
    data: { userId, albumId: data.albumId, playedAt: data.listenedOn, source: "manual" },
  });

  revalidatePath("/diary");
  return entry;
}

export async function deleteDiaryEntry(entryId: string) {
  const userId = await requireUserId();
  const { count } = await db.diaryEntry.deleteMany({ where: { id: entryId, userId } });
  if (count === 0) throw new Error("Entry not found or you don't have permission to delete it.");
  revalidatePath("/diary");
}

export async function getDiaryForMonth(userId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return db.diaryEntry.findMany({
    where: { userId, listenedOn: { gte: start, lt: end } },
    orderBy: { listenedOn: "desc" },
    include: { album: { include: { artist: true } } },
  });
}
