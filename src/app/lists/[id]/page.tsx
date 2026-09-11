import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth/session";
import { AlbumCard } from "@/components/AlbumCard";
import { Lock, Link2 } from "lucide-react";

interface Props {
  params: { id: string };
}

async function getList(id: string) {
  return db.musicList.findUnique({
    where: { id },
    include: {
      user: true,
      items: {
        orderBy: { position: "asc" },
        include: { album: { include: { artist: true } } },
      },
      _count: { select: { likes: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const list = await getList(params.id);
  if (!list || list.visibility === "PRIVATE") return {};
  return {
    title: list.title,
    description: list.description ?? `A list of ${list.items.length} albums on Soundboard.`,
    alternates: { canonical: `/lists/${list.id}` },
  };
}

export default async function ListDetailPage({ params }: Props) {
  const [list, currentUserId] = await Promise.all([getList(params.id), getCurrentUserId()]);
  if (!list) notFound();

  const isOwner = currentUserId === list.userId;
  if (list.visibility === "PRIVATE" && !isOwner) notFound();
  // UNLISTED: viewable by anyone with the link, just not surfaced in
  // browse/search — no extra check needed here, only in discovery queries.

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold">{list.title}</h1>
        {list.visibility === "PRIVATE" && <Lock size={16} className="text-muted-foreground" />}
        {list.visibility === "UNLISTED" && <Link2 size={16} className="text-muted-foreground" />}
      </div>
      <p className="mb-1 text-sm text-muted-foreground">
        by {list.user.displayName ?? list.user.username} · {list.items.length} albums ·{" "}
        {list._count.likes} likes
      </p>
      {list.description && <p className="mb-6 text-sm">{list.description}</p>}

      {list.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">This list is empty so far.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {list.items.map((item) => (
            <AlbumCard
              key={item.id}
              album={{
                id: item.album.id,
                title: item.album.title,
                artistName: item.album.artist.name,
                coverImageUrl: item.album.coverImageUrl,
              }}
              showRating={false}
              size="md"
            />
          ))}
        </div>
      )}
    </div>
  );
}
