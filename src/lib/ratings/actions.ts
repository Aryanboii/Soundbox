"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { rateAlbumSchema } from "@/lib/validation/rating";

/**
 * Create or update the current user's rating for an album.
 * Ownership is implicit: the composite unique (userId, albumId) key
 * means a user can only ever have one rating row per album, and the
 * userId always comes from the server session — never from the
 * client payload — so there is no way to rate on someone else's
 * behalf.
 */
export async function rateAlbum(input: unknown) {
  const userId = await requireUserId();
  const { albumId, value } = rateAlbumSchema.parse(input);

  const rating = await db.rating.upsert({
    where: { userId_albumId: { userId, albumId } },
    create: { userId, albumId, value },
    update: { value },
  });

  revalidatePath(`/album/${albumId}`);
  return rating;
}

export async function deleteAlbumRating(albumId: string) {
  const userId = await requireUserId();

  // deleteMany (not delete) so a mismatched userId silently affects
  // zero rows instead of throwing — never trust the caller's albumId
  // to be one this user actually owns a rating for.
  await db.rating.deleteMany({ where: { userId, albumId } });
  revalidatePath(`/album/${albumId}`);
}

export async function getAlbumRatingSummary(albumId: string) {
  const [aggregate, distribution] = await Promise.all([
    db.rating.aggregate({
      where: { albumId },
      _avg: { value: true },
      _count: true,
    }),
    db.rating.groupBy({
      by: ["value"],
      where: { albumId },
      _count: true,
    }),
  ]);

  return {
    average: aggregate._avg.value ?? 0,
    count: aggregate._count,
    distribution: distribution.sort((a, b) => a.value - b.value),
  };
}
