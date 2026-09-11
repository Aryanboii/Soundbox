"use client";

import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AlbumCard } from "@/components/AlbumCard";
import type { SearchResults } from "@/lib/music";

export default function SearchPage() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQueryChange(query: string) {
    if (!query) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      setResults(await res.json());
    } catch {
      setError("Couldn't reach the music catalog. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Search</h1>
      <SearchBar onQueryChange={handleQueryChange} autoFocus className="mb-8" />

      {loading && <p className="text-sm text-muted-foreground">Searching…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {results && results.albums.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Albums
          </h2>
          <div className="flex flex-wrap gap-4">
            {results.albums.map((a) => (
              <AlbumCard
                key={a.externalId}
                album={{
                  id: a.externalId,
                  title: a.title,
                  artistName: a.artistName,
                  coverImageUrl: a.coverImageUrl,
                  releaseYear: a.releaseDate?.slice(0, 4) ?? null,
                }}
                size="sm"
                showRating={false}
              />
            ))}
          </div>
        </section>
      )}

      {results && results.albums.length === 0 && results.artists.length === 0 && results.tracks.length === 0 && (
        <p className="text-sm text-muted-foreground">No results found.</p>
      )}
    </div>
  );
}
