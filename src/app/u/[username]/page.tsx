import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/session";
import { FollowButton } from "@/components/FollowButton";
import { AlbumCard } from "@/components/AlbumCard";
import { ReviewCard, type ReviewCardData } from "@/components/ReviewCard";

interface Props {
  params: { username: string };
}

async function getProfile(username: string) {
  return db.user.findUnique({
    where: { username },
    include: {
      favoriteAlbums: {
        orderBy: { order: "asc" },
        take: 5,
        include: { album: { include: { artist: true } } },
      },
      _count: { select: { followers: true, following: true, reviews: true, diaryEntries: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getProfile(params.username);
  if (!user) return {};
  return {
    title: user.displayName ?? user.username,
    description: user.bio ?? `${user.username} on Soundboard.`,
    alternates: { canonical: `/u/${user.username}` },
  };
}

export default async function ProfilePage({ params }: Props) {
  const [profile, currentUserId] = await Promise.all([
    getProfile(params.username),
    getCurrentUserId(),
  ]);
  if (!profile) notFound();

  const [isFollowing, recentReviewRows, ratingStats] = await Promise.all([
    currentUserId
      ? db.follow
          .findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: profile.id } },
          })
          .then((r) => !!r)
      : Promise.resolve(false),
    db.review.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: true,
        album: { include: { artist: true } },
        likes: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: { select: { likes: true, comments: true } },
      },
    }),
    db.rating.aggregate({ where: { userId: profile.id }, _avg: { value: true }, _count: true }),
  ]);

  const reviews: ReviewCardData[] = recentReviewRows.map((r) => ({
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

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-raised ring-1 ring-border">
          {profile.avatarUrl && (
            <Image src={profile.avatarUrl} alt={profile.username} fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold">
              {profile.displayName ?? profile.username}
            </h1>
            {!isOwnProfile && currentUserId && (
              <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{profile._count.followers}</strong> followers
            </span>
            <span>
              <strong className="text-foreground">{profile._count.following}</strong> following
            </span>
            <span>
              <strong className="text-foreground">{profile._count.reviews}</strong> reviews
            </span>
            <span>
              <strong className="text-foreground">{profile._count.diaryEntries}</strong> logged
            </span>
            {ratingStats._count > 0 && (
              <span>
                avg rating <strong className="text-foreground">{ratingStats._avg.value?.toFixed(1)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {profile.favoriteAlbums.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Favorite albums
          </h2>
          <div className="flex gap-4 overflow-x-auto">
            {profile.favoriteAlbums.map((fa) => (
              <AlbumCard
                key={fa.albumId}
                size="sm"
                showRating={false}
                album={{
                  id: fa.album.id,
                  title: fa.album.title,
                  artistName: fa.album.artist.name,
                  coverImageUrl: fa.album.coverImageUrl,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
