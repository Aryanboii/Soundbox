import type { MusicProvider } from "./provider";
import { spotifyProvider } from "./spotify";

export type { MusicProvider } from "./provider";
export * from "./provider";

/**
 * Single seam for swapping or adding providers later (e.g. falling
 * back to MusicBrainz when Spotify rate-limits, or blending sources).
 * Everything else in the app calls getMusicProvider() rather than
 * importing spotify.ts directly.
 */
export function getMusicProvider(): MusicProvider {
  return spotifyProvider;
}
