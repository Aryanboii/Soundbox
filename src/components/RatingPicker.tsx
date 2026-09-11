"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn, roundToHalfStar } from "@/lib/utils";

interface RatingPickerProps {
  value: number | null;
  onChange: (value: number) => void;
  onClear?: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const sizeMap = { sm: 20, md: 28, lg: 36 };

/**
 * Click/tap the left half of a star for X.5, the right half for X.0.
 * Keyboard users can use arrow keys once focused (0.5 increments).
 */
export function RatingPicker({
  value,
  onChange,
  onClear,
  size = "md",
  disabled,
  className,
}: RatingPickerProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const px = sizeMap[size];
  const displayValue = hoverValue ?? value ?? 0;

  function handleMove(starIndex: number, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    setHoverValue(starIndex + (isLeftHalf ? 0.5 : 1));
  }

  function handleClick(starIndex: number, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    const next = starIndex + (isLeftHalf ? 0.5 : 1);
    if (next === value && onClear) {
      onClear();
    } else {
      onChange(roundToHalfStar(next));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    const current = value ?? 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(roundToHalfStar(current + 0.5));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(roundToHalfStar(current - 0.5));
    }
  }

  return (
    <div
      className={cn("inline-flex gap-0.5", disabled && "pointer-events-none opacity-50", className)}
      onMouseLeave={() => setHoverValue(null)}
      role="slider"
      aria-label="Rating"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value ?? 0}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = displayValue >= i + 1;
        const half = !filled && displayValue > i && displayValue < i + 1;
        return (
          <div
            key={i}
            className="relative cursor-pointer"
            style={{ width: px, height: px }}
            onMouseMove={(e) => handleMove(i, e)}
            onClick={(e) => handleClick(i, e)}
          >
            <Star width={px} height={px} className="absolute inset-0 fill-none text-muted-foreground" />
            {(filled || half) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? "50%" : "100%" }}
              >
                <Star width={px} height={px} className="fill-accent text-accent" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
