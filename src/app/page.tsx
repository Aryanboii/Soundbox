import { db } from "@/lib/db";
import { ReviewCard, type ReviewCardData } from "@/components/ReviewCard";
import { getCurrentUserId } from "@/lib/auth/session";

export const revalidate = 30; // feed can be briefly stale; not real-time chat

async function getFeedReviews(currentUserId: string | null): Promise<ReviewCardData[]> {
  const reviews = await db.review.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      album: { include: { artist: true } },
      likes: currentUserId ? { where: { userId: currentUserId } } : false,
      _count: { select: { likes: true, comments: true } },
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    body: r.body,
    rating: r.rating,
    createdAt: r.createdAt.toISOString(),
    containsSpoilers: r.containsSpoilers,
    author: {
      id: r.user.id,
      username: r.user.username,
      displayName: r.user.displayName,
      avatarUrl: r.user.avatarUrl,
    },
    album: {
      id: r.album.id,
      title: r.album.title,
      artistName: r.album.artist.name,
      coverImageUrl: r.album.coverImageUrl,
    },
    likeCount: r._count.likes,
    commentCount: r._count.comments,
    likedByCurrentUser: Array.isArray(r.likes) && r.likes.length > 0,
  }));
}

export default async function FeedPage() {
  const currentUserId = await getCurrentUserId();
  const reviews = await getFeedReviews(currentUserId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Your feed</h1>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Nothing here yet</p>
          <p className="text-sm">
            Follow other listeners or rate your first album to start seeing activity.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
