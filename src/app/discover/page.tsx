import { getMusicProvider } from "@/lib/music";
import { db } from "@/lib/db";
import { AlbumCard, type AlbumCardData } from "@/components/AlbumCard";

export const metadata = { title: "Discover" };
export const revalidate = 3600;

function externalToCard(a: {
  externalId: string;
  title: string;
  artistName: string;
  coverImageUrl: string | null;
  releaseDate: string | null;
}): AlbumCardData {
  return {
    id: a.externalId, // note: not-yet-imported albums link via external id until first interaction promotes them
    title: a.title,
    artistName: a.artistName,
    coverImageUrl: a.coverImageUrl,
    releaseYear: a.releaseDate?.slice(0, 4) ?? null,
  };
}

async function getTopRatedOnSoundboard(): Promise<AlbumCardData[]> {
  const rows = await db.rating.groupBy({
    by: ["albumId"],
    where: { albumId: { not: null } },
    _avg: { value: true },
    _count: true,
    having: { albumId: { _count: { gte: 3 } } }, // avoid single-vote noise
    orderBy: { _avg: { value: "desc" } },
    take: 12,
  });

  const albumIds = rows.map((r) => r.albumId).filter((id): id is string => !!id);
  const albums = await db.album.findMany({
    where: { id: { in: albumIds } },
    include: { artist: true },
  });
  const albumMap = new Map(albums.map((a) => [a.id, a]));

  return rows
    .map((r) => {
      const album = r.albumId ? albumMap.get(r.albumId) : undefined;
      if (!album) return null;
      return {
        id: album.id,
        title: album.title,
        artistName: album.artist.name,
        coverImageUrl: album.coverImageUrl,
        averageRating: r._avg.value ?? 0,
        ratingCount: r._count,
        releaseYear: album.releaseDate?.getFullYear().toString() ?? null,
      } satisfies AlbumCardData;
    })
    .filter((a): a is AlbumCardData => a !== null);
}

export default async function DiscoverPage() {
  const provider = getMusicProvider();
  const [newReleases, trending, topRated] = await Promise.all([
    provider.getNewReleases(12).catch(() => []),
    provider.getTrending(12).catch(() => []),
    getTopRatedOnSoundboard(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-semibold">Discover</h1>

      <Section title="Top rated on Soundboard" albums={topRated} empty="No community ratings yet — be the first to rate something." />
      <Section title="New releases" albums={newReleases.map(externalToCard)} />
      <Section title="Trending" albums={trending.map(externalToCard)} />
    </div>
  );
}

function Section({
  title,
  albums,
  empty,
}: {
  title: string;
  albums: AlbumCardData[];
  empty?: string;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {albums.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty ?? "Nothing to show right now."}</p>
      ) : (
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} size="md" />
          ))}
        </div>
      )}
    </section>
  );
}
