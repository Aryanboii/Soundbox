import Image from "next/image";
import Link from "next/link";
import { RatingStars } from "./RatingStars";
import { cn } from "@/lib/utils";

export interface AlbumCardData {
  id: string;
  title: string;
  artistName: string;
  coverImageUrl: string | null;
  averageRating?: number;
  ratingCount?: number;
  releaseYear?: string | null;
}

interface AlbumCardProps {
  album: AlbumCardData;
  size?: "sm" | "md" | "lg";
  showRating?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-28",
  md: "w-40",
  lg: "w-56",
};

/**
 * The single most-reused component in the product — album artwork
 * is the visual anchor everywhere (feed, discovery grids, lists,
 * search results, diary). Keep it dumb: it takes plain data, never
 * fetches, so it renders identically from a Server or Client
 * Component.
 */
export function AlbumCard({ album, size = "md", showRating = true, className }: AlbumCardProps) {
  return (
    <Link
      href={`/album/${album.id}`}
      className={cn(
        "group flex flex-col gap-2 rounded-md transition-transform hover:-translate-y-0.5",
        sizeClasses[size],
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface-raised shadow-sm ring-1 ring-border">
        {album.coverImageUrl ? (
          <Image
            src={album.coverImageUrl}
            alt={`${album.title} cover art`}
            fill
            sizes="(max-width: 768px) 33vw, 224px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No artwork
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="truncate text-sm font-medium leading-tight text-foreground">{album.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {album.artistName}
          {album.releaseYear ? ` · ${album.releaseYear}` : ""}
        </p>
        {showRating && typeof album.averageRating === "number" && (
          <RatingStars value={album.averageRating} size="sm" />
        )}
      </div>
    </Link>
  );
}
