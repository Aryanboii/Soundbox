import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RatingStars } from "@/components/RatingStars";
import { ReviewCard, type ReviewCardData } from "@/components/ReviewCard";
import { ReviewComposer } from "@/components/ReviewComposer";
import { getCurrentUserId } from "@/lib/auth/session";
import { getAlbumRatingSummary } from "@/lib/ratings/actions";

interface Props {
  params: { id: string };
}

async function getAlbum(id: string) {
  return db.album.findUnique({
    where: { id },
    include: { artist: true, genres: { include: { genre: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = await getAlbum(params.id);
  if (!album) return {};

  return {
    title: `${album.title} by ${album.artist.name}`,
    description: `Rate and review ${album.title} by ${album.artist.name} on Soundboard.`,
    openGraph: {
      title: `${album.title} by ${album.artist.name}`,
      images: album.coverImageUrl ? [album.coverImageUrl] : [],
      type: "music.album",
    },
    alternates: { canonical: `/album/${album.id}` },
  };
}

export default async function AlbumPage({ params }: Props) {
  const [album, currentUserId] = await Promise.all([
    getAlbum(params.id),
    getCurrentUserId(),
  ]);
  if (!album) notFound();

  const [ratingSummary, reviewRows, myReview] = await Promise.all([
    getAlbumRatingSummary(album.id),
    db.review.findMany({
      where: { albumId: album.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: true,
        likes: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: { select: { likes: true, comments: true } },
      },
    }),
    currentUserId
      ? db.review.findUnique({ where: { userId_albumId: { userId: currentUserId, albumId: album.id } } })
      : null,
  ]);

  const reviews: ReviewCardData[] = reviewRows.map((r) => ({
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
    album: { id: album.id, title: album.title, artistName: album.artist.name, coverImageUrl: album.coverImageUrl },
    likeCount: r._count.likes,
    commentCount: r._count.comments,
    likedByCurrentUser: Array.isArray(r.likes) && r.likes.length > 0,
  }));

  // JSON-LD structured data for the album, per the SEO requirement.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    byArtist: { "@type": "MusicGroup", name: album.artist.name },
    aggregateRating:
      ratingSummary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.average.toFixed(1),
            ratingCount: ratingSummary.count,
            bestRating: 5,
            worstRating: 0.5,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-lg bg-surface-raised ring-1 ring-border">
          {album.coverImageUrl && (
            <Image src={album.coverImageUrl} alt={`${album.title} cover art`} fill sizes="320px" className="object-cover" priority />
          )}
        </div>
        <div className="flex flex-col justify-end gap-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Album</p>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{album.title}</h1>
          <p className="text-lg text-muted-foreground">{album.artist.name}</p>
          <div className="flex items-center gap-3">
            <RatingStars value={ratingSummary.average} showValue />
            <span className="text-sm text-muted-foreground">
              {ratingSummary.count} rating{ratingSummary.count === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Your review</h2>
        {currentUserId ? (
          <ReviewComposer
            albumId={album.id}
            initialRating={myReview?.rating ?? null}
            initialBody={myReview?.body ?? ""}
            initialContainsSpoilers={myReview?.containsSpoilers ?? false}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="text-accent hover:underline">Log in</a> to rate or review this album.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your take.</p>
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
