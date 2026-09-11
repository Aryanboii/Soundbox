"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RatingPicker } from "./RatingPicker";
import { Button } from "./ui/button";
import { upsertReview } from "@/lib/reviews/actions";

interface ReviewComposerProps {
  albumId: string;
  initialRating?: number | null;
  initialBody?: string;
  initialContainsSpoilers?: boolean;
  onSaved?: () => void;
}

/**
 * Combined rating + review composer. A rating alone (no text) is a
 * valid interaction handled by RatingPicker directly elsewhere — this
 * component is specifically for the "write a review" flow, which
 * always requires body text (see createReviewSchema).
 */
export function ReviewComposer({
  albumId,
  initialRating = null,
  initialBody = "",
  initialContainsSpoilers = false,
  onSaved,
}: ReviewComposerProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(initialRating);
  const [body, setBody] = useState(initialBody);
  const [containsSpoilers, setContainsSpoilers] = useState(initialContainsSpoilers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Write something before posting your review.");
      return;
    }
    setSubmitting(true);
    try {
      await upsertReview({
        albumId,
        rating: rating ?? undefined,
        body: body.trim(),
        containsSpoilers,
      });
      onSaved?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Your rating</span>
        <RatingPicker value={rating} onChange={setRating} onClear={() => setRating(null)} size="md" />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think?"
        rows={4}
        maxLength={10_000}
        className="input resize-y"
      />

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={containsSpoilers}
          onChange={(e) => setContainsSpoilers(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        This review contains spoilers (e.g. concept album plot, lyric content)
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="self-end">
        {submitting ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}
