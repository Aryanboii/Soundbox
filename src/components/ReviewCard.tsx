import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Share2, Bookmark } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { LikeButton } from "./LikeButton";
import { cn } from "@/lib/utils";

export interface ReviewCardData {
  id: string;
  body: string;
  rating: number | null;
  createdAt: string;
  containsSpoilers: boolean;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  album: { id: string; title: string; artistName: string; coverImageUrl: string | null };
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
}

interface ReviewCardProps {
  review: ReviewCardData;
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <article
      className={cn(
        "flex gap-4 rounded-lg border border-border bg-surface p-4 animate-slide-up",
        className,
      )}
    >
      <Link href={`/album/${review.album.id}`} className="shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-md bg-surface-raised ring-1 ring-border sm:h-24 sm:w-24">
          {review.album.coverImageUrl && (
            <Image
              src={review.album.coverImageUrl}
              alt={review.album.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link href={`/u/${review.author.username}`} className="font-medium hover:underline">
            {review.author.displayName ?? review.author.username}
          </Link>
          <span className="text-muted-foreground">reviewed</span>
          <Link href={`/album/${review.album.id}`} className="font-medium hover:underline">
            {review.album.title}
          </Link>
          {review.rating != null && <RatingStars value={review.rating} size="sm" />}
        </div>

        {review.containsSpoilers ? (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer select-none">Contains spoilers — tap to reveal</summary>
            <p className="mt-2 whitespace-pre-wrap text-foreground">{review.body}</p>
          </details>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground line-clamp-6">{review.body}</p>
        )}

        <div className="mt-1 flex items-center gap-4 text-muted-foreground">
          <LikeButton
            reviewId={review.id}
            initialLiked={review.likedByCurrentUser}
            initialCount={review.likeCount}
          />
          <Link href={`/review/${review.id}`} className="flex items-center gap-1 text-xs hover:text-foreground">
            <MessageCircle size={16} />
            {review.commentCount}
          </Link>
          <button type="button" className="flex items-center gap-1 text-xs hover:text-foreground">
            <Share2 size={16} />
          </button>
          <button type="button" className="ml-auto flex items-center gap-1 text-xs hover:text-foreground">
            <Bookmark size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
