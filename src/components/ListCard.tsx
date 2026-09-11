import Link from "next/link";
import Image from "next/image";
import { Heart, Lock, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListCardData {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  coverImages: string[]; // first few album covers, for a collage preview
  itemCount: number;
  likeCount: number;
  owner: { username: string; displayName: string | null };
}

export function ListCard({ list, className }: { list: ListCardData; className?: string }) {
  return (
    <Link
      href={`/lists/${list.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/50",
        className,
      )}
    >
      <div className="grid grid-cols-4 gap-1 overflow-hidden rounded-md">
        {Array.from({ length: 4 }, (_, i) => list.coverImages[i]).map((src, i) => (
          <div key={i} className="relative aspect-square bg-surface-raised">
            {src && <Image src={src} alt="" fill sizes="80px" className="object-cover" />}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-medium">{list.title}</h3>
          {list.visibility === "PRIVATE" && <Lock size={12} className="shrink-0 text-muted-foreground" />}
          {list.visibility === "UNLISTED" && <Link2 size={12} className="shrink-0 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">
          by {list.owner.displayName ?? list.owner.username} · {list.itemCount} albums
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Heart size={14} />
        {list.likeCount}
      </div>
    </Link>
  );
}
