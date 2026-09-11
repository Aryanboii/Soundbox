import type {
  MusicProvider,
  ExternalAlbumSummary,
  ExternalArtistSummary,
  ExternalTrackSummary,
  ExternalAlbumDetail,
  ExternalArtistDetail,
  SearchResults,
} from "./provider";

/**
 * Spotify Web API provider — read-only catalog access via the
 * Client Credentials flow. This does NOT log the user into Spotify
 * and does NOT touch a user's personal library; it only gives us
 * server-to-server access to public catalog data (search, albums,
 * artists, tracks), which is what search/discovery/rating targets
 * need. Per Spotify's Developer Terms, we only cache metadata
 * (names, IDs, cover art URLs) needed to power our own features —
 * we don't redistribute bulk catalog data.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let tokenCache: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify credentials missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env",
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

async function spotifyFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // Catalog metadata is safe to cache briefly; adjust per route needs.
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Spotify API error ${res.status} on ${path}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

// ---- Spotify API response shapes (trimmed to fields we use) ----

interface SpotifyImage {
  url: string;
}
interface SpotifyArtistRef {
  id: string;
  name: string;
}
interface SpotifyAlbumObj {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
  artists: SpotifyArtistRef[];
  genres?: string[];
  label?: string;
}
interface SpotifyTrackObj {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: SpotifyArtistRef[];
  album?: { id: string; name: string };
}
interface SpotifyArtistObj {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
}

function toAlbumSummary(a: SpotifyAlbumObj): ExternalAlbumSummary {
  const primaryArtist = a.artists[0];
  return {
    externalId: a.id,
    title: a.name,
    artistName: primaryArtist?.name ?? "Unknown Artist",
    artistExternalId: primaryArtist?.id ?? "",
    coverImageUrl: a.images[0]?.url ?? null,
    releaseDate: a.release_date ?? null,
    trackCount: a.total_tracks ?? null,
  };
}

function toArtistSummary(a: SpotifyArtistObj): ExternalArtistSummary {
  return {
    externalId: a.id,
    name: a.name,
    imageUrl: a.images[0]?.url ?? null,
    genres: a.genres ?? [],
  };
}

function toTrackSummary(t: SpotifyTrackObj): ExternalTrackSummary {
  return {
    externalId: t.id,
    title: t.name,
    artistName: t.artists[0]?.name ?? "Unknown Artist",
    albumExternalId: t.album?.id ?? null,
    albumTitle: t.album?.name ?? null,
    durationMs: t.duration_ms ?? null,
    trackNumber: t.track_number ?? null,
  };
}

export const spotifyProvider: MusicProvider = {
  name: "spotify",

  async searchAlbums(query, limit = 20) {
    const data = await spotifyFetch<{ albums: { items: SpotifyAlbumObj[] } }>("/search", {
      q: query,
      type: "album",
      limit: String(limit),
    });
    return data.albums.items.map(toAlbumSummary);
  },

  async searchArtists(query, limit = 20) {
    const data = await spotifyFetch<{ artists: { items: SpotifyArtistObj[] } }>("/search", {
      q: query,
      type: "artist",
      limit: String(limit),
    });
    return data.artists.items.map(toArtistSummary);
  },

  async searchTracks(query, limit = 20) {
    const data = await spotifyFetch<{ tracks: { items: SpotifyTrackObj[] } }>("/search", {
      q: query,
      type: "track",
      limit: String(limit),
    });
    return data.tracks.items.map(toTrackSummary);
  },

  async search(query, limit = 10): Promise<SearchResults> {
    const data = await spotifyFetch<{
      albums: { items: SpotifyAlbumObj[] };
      artists: { items: SpotifyArtistObj[] };
      tracks: { items: SpotifyTrackObj[] };
    }>("/search", {
      q: query,
      type: "album,artist,track",
      limit: String(limit),
    });
    return {
      albums: data.albums.items.map(toAlbumSummary),
      artists: data.artists.items.map(toArtistSummary),
      tracks: data.tracks.items.map(toTrackSummary),
    };
  },

  async getAlbum(externalId): Promise<ExternalAlbumDetail | null> {
    try {
      const [album, tracksRes] = await Promise.all([
        spotifyFetch<SpotifyAlbumObj>(`/albums/${externalId}`),
        spotifyFetch<{ items: SpotifyTrackObj[] }>(`/albums/${externalId}/tracks`, {
          limit: "50",
        }),
      ]);
      return {
        ...toAlbumSummary(album),
        genres: album.genres ?? [],
        label: album.label ?? null,
        tracks: tracksRes.items.map((t) =>
          toTrackSummary({ ...t, album: { id: album.id, name: album.name } }),
        ),
      };
    } catch {
      return null;
    }
  },

  async getArtist(externalId): Promise<ExternalArtistDetail | null> {
    try {
      const [artist, albumsRes] = await Promise.all([
        spotifyFetch<SpotifyArtistObj>(`/artists/${externalId}`),
        spotifyFetch<{ items: SpotifyAlbumObj[] }>(`/artists/${externalId}/albums`, {
          include_groups: "album,single",
          limit: "50",
        }),
      ]);
      return {
        ...toArtistSummary(artist),
        bio: null, // Spotify's API does not expose artist bios
        albums: albumsRes.items.map(toAlbumSummary),
      };
    } catch {
      return null;
    }
  },

  async getTrack(externalId): Promise<ExternalTrackSummary | null> {
    try {
      const track = await spotifyFetch<SpotifyTrackObj>(`/tracks/${externalId}`);
      return toTrackSummary(track);
    } catch {
      return null;
    }
  },

  async getNewReleases(limit = 20) {
    const data = await spotifyFetch<{ albums: { items: SpotifyAlbumObj[] } }>(
      "/browse/new-releases",
      { limit: String(limit) },
    );
    return data.albums.items.map(toAlbumSummary);
  },

  async getTrending(limit = 20) {
    // Spotify's Web API has no direct "trending albums" endpoint for
    // client-credentials apps; new releases is the closest catalog-level
    // signal. Real trending should ultimately be computed from OUR OWN
    // rating/listen activity (see src/lib/discovery) once there's data.
    return this.getNewReleases(limit);
  },
};
