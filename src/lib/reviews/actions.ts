"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/session";
import { createReviewSchema } from "@/lib/validation/rating";

export async function upsertReview(input: unknown) {
  const userId = await requireUserId();
  const { albumId, rating, body, containsSpoilers } = createReviewSchema.parse(input);

  const review = await db.review.upsert({
    where: { userId_albumId: { userId, albumId } },
    create: { userId, albumId, rating, body, containsSpoilers },
    update: { rating, body, containsSpoilers },
  });

  // Keep the standalone Rating row in sync if the review carries a rating,
  // so the album's aggregate rating reflects it too.
  if (rating != null) {
    await db.rating.upsert({
      where: { userId_albumId: { userId, albumId } },
      create: { userId, albumId, value: rating },
      update: { value: rating },
    });
  }

  revalidatePath(`/album/${albumId}`);
  revalidatePath("/");
  return review;
}

export async function deleteReview(reviewId: string) {
  const userId = await requireUserId();

  // deleteMany with both id AND userId in the filter — the ownership
  // check IS the query, not a separate step that could be skipped.
  const { count } = await db.review.deleteMany({ where: { id: reviewId, userId } });
  if (count === 0) throw new Error("Review not found or you don't have permission to delete it.");
}

export async function toggleReviewLike(reviewId: string) {
  const userId = await requireUserId();

  const existing = await db.like.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  const review = await db.review.findUnique({ where: { id: reviewId }, select: { userId: true } });
  await db.like.create({ data: { userId, reviewId } });

  if (review && review.userId !== userId) {
    await db.notification.create({
      data: { recipientId: review.userId, actorId: userId, type: "REVIEW_LIKE", reviewId },
    });
  }

  return { liked: true };
}

export async function addComment(reviewId: string, body: string, parentId?: string) {
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 1000) {
    throw new Error("Comment must be between 1 and 1000 characters.");
  }

  const comment = await db.comment.create({
    data: { reviewId, userId, body: trimmed, parentId },
  });

  const review = await db.review.findUnique({ where: { id: reviewId }, select: { userId: true } });
  if (review && review.userId !== userId) {
    await db.notification.create({
      data: {
        recipientId: review.userId,
        actorId: userId,
        type: parentId ? "COMMENT_REPLY" : "REVIEW_COMMENT",
        reviewId,
        commentId: comment.id,
      },
    });
  }

  revalidatePath(`/review/${reviewId}`);
  return comment;
}
