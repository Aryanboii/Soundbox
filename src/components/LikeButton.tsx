"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleReviewLike } from "@/lib/reviews/actions";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  reviewId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ reviewId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // Optimistic update, reconciled against the server's actual result.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      try {
        const result = await toggleReviewLike({ reviewId });
        setLiked(result.liked);
      } catch {
        // Roll back on failure (e.g. not signed in).
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      className={cn(
        "flex items-center gap-1 text-xs hover:text-accent disabled:opacity-60",
        liked && "text-accent",
      )}
    >
      <Heart size={16} className={liked ? "fill-accent" : ""} />
      {count}
    </button>
  );
}
