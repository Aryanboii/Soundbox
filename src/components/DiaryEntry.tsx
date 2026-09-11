import Image from "next/image";
import Link from "next/link";
import { RatingStars } from "./RatingStars";

export interface DiaryEntryData {
  id: string;
  listenedOn: string; // ISO date
  rating: number | null;
  reviewText: string | null;
  isReListen: boolean;
  album: { id: string; title: string; artistName: string; coverImageUrl: string | null };
}

export function DiaryEntry({ entry }: { entry: DiaryEntryData }) {
  const date = new Date(entry.listenedOn);

  return (
    <div className="flex items-center gap-4 border-b border-border py-3 last:border-0">
      <div className="w-14 shrink-0 text-center">
        <p className="text-xs uppercase text-muted-foreground">
          {date.toLocaleDateString(undefined, { month: "short" })}
        </p>
        <p className="text-lg font-semibold leading-none">{date.getDate()}</p>
      </div>

      <Link href={`/album/${entry.album.id}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-raised ring-1 ring-border">
        {entry.album.coverImageUrl && (
          <Image src={entry.album.coverImageUrl} alt={entry.album.title} fill sizes="48px" className="object-cover" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/album/${entry.album.id}`} className="truncate text-sm font-medium hover:underline">
          {entry.album.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {entry.album.artistName}
          {entry.isReListen ? " · re-listen" : ""}
        </p>
      </div>

      {entry.rating != null && <RatingStars value={entry.rating} size="sm" />}
    </div>
  );
}
