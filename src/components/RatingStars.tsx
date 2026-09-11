import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  /** 0–5, may include .5 */
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = { sm: 14, md: 18, lg: 24 };

/**
 * Pure display component — five stars, each fully filled, half-filled
 * or empty depending on `value`. For an interactive input, see
 * RatingPicker.tsx.
 */
export function RatingStars({ value, size = "md", showValue = false, className }: RatingStarsProps) {
  const px = sizeMap[size];
  const clamped = Math.min(5, Math.max(0, value));

  return (
    <div className={cn("inline-flex items-center gap-1", className)} role="img" aria-label={`${clamped} out of 5 stars`}>
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const filled = clamped >= starValue;
          const half = !filled && clamped > i && clamped < starValue;

          if (half) {
            return (
              <StarHalf
                key={i}
                width={px}
                height={px}
                className="fill-accent text-accent"
                aria-hidden
              />
            );
          }
          return (
            <Star
              key={i}
              width={px}
              height={px}
              className={filled ? "fill-accent text-accent" : "fill-none text-muted-foreground"}
              aria-hidden
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground">{clamped.toFixed(1)}</span>
      )}
    </div>
  );
}
