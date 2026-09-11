/**
 * MusicProvider abstraction
 * ---------------------------------------------------------------
 * Nothing outside this folder should know which external catalog
 * (Spotify, MusicBrainz, Apple Music, ...) actually backs search
 * and metadata. Routes, server actions, and UI code depend only on
 * these types and on `getMusicProvider()` from `./index.ts`.
 *
 * IMPORTANT: `externalId` (the provider's own ID, e.g. a Spotify
 * URI) is always kept separate from our internal database ID. We
 * never assume the two are interchangeable — a provider can be
 * swapped or an item can be re-matched without breaking foreign
 * keys elsewhere in the schema. See `Album.spotifyId` /
 * `Album.id` in prisma/schema.prisma.
 */

export interface ExternalArtistSummary {
  externalId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
}

export interface ExternalAlbumSummary {
  externalId: string;
  title: string;
  artistName: string;
  artistExternalId: string;
  coverImageUrl: string | null;
  releaseDate: string | null; // ISO date, may be year-only
  trackCount: number | null;
}

export interface ExternalTrackSummary {
  externalId: string;
  title: string;
  artistName: string;
  albumExternalId: string | null;
  albumTitle: string | null;
  durationMs: number | null;
  trackNumber: number | null;
}

export interface ExternalAlbumDetail extends ExternalAlbumSummary {
  genres: string[];
  label: string | null;
  tracks: ExternalTrackSummary[];
}

export interface ExternalArtistDetail extends ExternalArtistSummary {
  bio: string | null;
  albums: ExternalAlbumSummary[];
}

export interface SearchResults {
  albums: ExternalAlbumSummary[];
  artists: ExternalArtistSummary[];
  tracks: ExternalTrackSummary[];
}

export interface MusicProvider {
  readonly name: string;

  searchAlbums(query: string, limit?: number): Promise<ExternalAlbumSummary[]>;
  searchArtists(query: string, limit?: number): Promise<ExternalArtistSummary[]>;
  searchTracks(query: string, limit?: number): Promise<ExternalTrackSummary[]>;
  search(query: string, limit?: number): Promise<SearchResults>;

  getAlbum(externalId: string): Promise<ExternalAlbumDetail | null>;
  getArtist(externalId: string): Promise<ExternalArtistDetail | null>;
  getTrack(externalId: string): Promise<ExternalTrackSummary | null>;

  getNewReleases(limit?: number): Promise<ExternalAlbumSummary[]>;
  /** "Trending" per the provider's own charts/features endpoint, where available. */
  getTrending(limit?: number): Promise<ExternalAlbumSummary[]>;
}
