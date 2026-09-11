import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ListCard, type ListCardData } from "@/components/ListCard";
import { CreateListForm } from "@/components/CreateListForm";

export const metadata = { title: "Your lists" };

async function getUserLists(userId: string): Promise<ListCardData[]> {
  const lists = await db.musicList.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      items: {
        take: 4,
        orderBy: { position: "asc" },
        include: { album: true },
      },
      _count: { select: { items: true, likes: true } },
    },
  });

  return lists.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    visibility: l.visibility,
    coverImages: l.items.map((i) => i.album.coverImageUrl).filter((u): u is string => !!u),
    itemCount: l._count.items,
    likeCount: l._count.likes,
    owner: { username: l.user.username, displayName: l.user.displayName },
  }));
}

export default async function ListsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const lists = await getUserLists(userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Your lists</h1>
      </div>

      <CreateListForm className="mb-8" />

      {lists.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No lists yet — start one to organize albums by mood, decade, or anything else.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
