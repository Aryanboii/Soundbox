import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDiaryForMonth } from "@/lib/diary/actions";
import { DiaryEntry, type DiaryEntryData } from "@/components/DiaryEntry";

export const metadata = { title: "Diary" };

interface Props {
  searchParams: { year?: string; month?: string };
}

export default async function DiaryPage({ searchParams }: Props) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const now = new Date();
  const year = Number(searchParams.year) || now.getFullYear();
  const month = Number(searchParams.month) || now.getMonth() + 1;

  const rows = await getDiaryForMonth(userId, year, month);
  const entries: DiaryEntryData[] = rows.map((e) => ({
    id: e.id,
    listenedOn: e.listenedOn.toISOString(),
    rating: e.rating,
    reviewText: e.reviewText,
    isReListen: e.isReListen,
    album: {
      id: e.album.id,
      title: e.album.title,
      artistName: e.album.artist.name,
      coverImageUrl: e.album.coverImageUrl,
    },
  }));

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">{monthLabel}</h1>
        <div className="flex gap-2 text-sm">
          <a href={`/diary?year=${prev.year}&month=${prev.month}`} className="hover:text-accent">
            ← Prev
          </a>
          <a href={`/diary?year=${next.year}&month=${next.month}`} className="hover:text-accent">
            Next →
          </a>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing logged this month yet.</p>
      ) : (
        <div className="rounded-lg border border-border bg-surface px-4">
          {entries.map((entry) => (
            <DiaryEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
