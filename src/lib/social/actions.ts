"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";

export async function followUser(targetUserId: string) {
  const userId = await requireUserId();
  if (userId === targetUserId) throw new Error("You can't follow yourself.");

  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
  });
  if (blocked) throw new Error("Can't follow this user.");

  await db.follow.upsert({
    where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
    create: { followerId: userId, followingId: targetUserId },
    update: {},
  });

  await db.notification.create({
    data: { recipientId: targetUserId, actorId: userId, type: "FOLLOW" },
  });

  revalidatePath(`/u/${targetUserId}`);
  return { following: true };
}

export async function unfollowUser(targetUserId: string) {
  const userId = await requireUserId();
  await db.follow.deleteMany({ where: { followerId: userId, followingId: targetUserId } });
  revalidatePath(`/u/${targetUserId}`);
  return { following: false };
}

export async function blockUser(targetUserId: string) {
  const userId = await requireUserId();
  if (userId === targetUserId) throw new Error("You can't block yourself.");

  await db.$transaction([
    db.block.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetUserId } },
      create: { blockerId: userId, blockedId: targetUserId },
      update: {},
    }),
    // Blocking severs any existing follow in either direction.
    db.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: targetUserId },
          { followerId: targetUserId, followingId: userId },
        ],
      },
    }),
  ]);

  revalidatePath(`/u/${targetUserId}`);
}

export async function unblockUser(targetUserId: string) {
  const userId = await requireUserId();
  await db.block.deleteMany({ where: { blockerId: userId, blockedId: targetUserId } });
  revalidatePath(`/u/${targetUserId}`);
}

/** Used to filter feeds/search results — never show content from users who blocked you or whom you've blocked. */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const rows = await db.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  }
  return Array.from(ids);
}
