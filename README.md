# Soundboard

A social music platform — discover, rate, review, and log the music you
listen to. "Letterboxd for music."

## Status: Phases 1–7 partially built, 8–12 not started

This repo has a **real, runnable core product loop**, not a mockup —
every button shown is wired to a server action and the database:

- ✅ Next.js 14 App Router + TypeScript + Tailwind, dark/light design system
  (near-black / off-white / warm gold, per spec)
- ✅ Full Prisma schema covering every model in the spec (auth, catalog
  cache, ratings, reviews, comments, likes, diary, lists, follows/blocks,
  notifications, reports/moderation) with unique constraints preventing
  duplicate ratings/follows/likes
- ✅ `MusicProvider` abstraction + a working Spotify Web API implementation
  (client-credentials flow — catalog search only, no user Spotify login)
- ✅ Auth: email/password signup/login via NextAuth Credentials provider,
  password reset request/consume flow, OAuth-ready (Prisma adapter +
  Account/Session models already in place for adding Google/Apple later)
- ✅ Server-side authorization pattern used everywhere a mutation happens:
  the user id always comes from the server session (`requireUserId()`),
  never the client payload, and ownership checks are baked into the
  `where` clause of every update/delete (see `src/lib/*/actions.ts`)
- ✅ Ratings (0.5-star increments) + reviews: create/edit/delete, like
  (optimistic UI via `LikeButton`), comments/replies, spoiler tagging
- ✅ Diary: log an album with a date, rating, optional re-listen flag;
  month-by-month calendar-style view at `/diary`
- ✅ Lists: create, add/remove albums, reorder (transactional), like,
  public/unlisted/private visibility enforced on the detail page
- ✅ Social graph: follow/unfollow, block (severs existing follows both
  ways), profile pages with stats and a follow button
- ✅ Notifications are written on like/comment/follow/list-like (schema +
  write side); there's no notifications inbox UI yet (see Not yet built)
- ✅ Core reusable components: `AlbumCard`, `RatingStars`, `RatingPicker`,
  `ReviewCard`, `ReviewComposer`, `ListCard`, `DiaryEntry`, `Sidebar`,
  `MobileNav`, `SearchBar`, `FollowButton`, `LikeButton`
- ✅ Pages: feed (`/`), discover (`/discover`), search (`/search`), album
  detail with SEO metadata + JSON-LD (`/album/[id]`), diary (`/diary`),
  lists index + detail (`/lists`, `/lists/[id]`), profile (`/u/[username]`),
  signup/login
- ✅ Vitest unit tests for rating validation; GitHub Actions CI (lint,
  typecheck, test, build) with a real Postgres service container

**Not yet built:**
- Notifications inbox UI (bell icon, mark-as-read, list view)
- Discover's "recommended for you" / "hidden gems" (currently: top-rated,
  new releases, trending only — trending is a Spotify new-releases proxy,
  not yet computed from our own activity)
- Statistics dashboards and the yearly recap
- Moderation dashboard (report-filing schema/actions exist; no UI)
- List drag-to-reorder UI (the `reorderList` action exists; no drag
  interaction wired up yet)
- Comment thread UI on a dedicated review page (`addComment` action
  exists; `/review/[id]` page not built)
- Full E2E test coverage (signup → search → album → rate → review → diary)
- Image upload for avatars, taste-profile visualizations
- Blocked-user filtering isn't yet applied inside the feed/search queries
  (the `getBlockedUserIds` helper exists in `src/lib/social/actions.ts`
  but callers don't use it yet — treat this as a known gap, not a bug
  you introduced)

## Getting started

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, NEXTAUTH_SECRET, Spotify keys
npx prisma db push      # or: npx prisma migrate dev
npm run db:seed         # optional demo data
npm run dev
```

### Spotify credentials (required for search/discovery)

1. Create an app at https://developer.spotify.com/dashboard
2. Copy the Client ID and Client Secret into `.env`
3. No redirect URI or user login is needed for Phase 1 — this uses the
   **Client Credentials flow**, which is server-to-server catalog access
   only. If you later want Spotify *login* (as opposed to catalog
   search), that's a separate OAuth provider addition in
   `src/lib/auth/auth.ts`.

### Generate a NextAuth secret

```bash
openssl rand -base64 32
```

## Architecture

Code is organized by domain, matching the spec:

```
src/
  app/                 # routes (App Router)
  components/          # shared UI (AlbumCard, RatingStars, ReviewCard, ...)
  lib/
    auth/              # NextAuth config, session helpers, signup/reset actions
    music/             # MusicProvider abstraction + Spotify implementation
    ratings/           # server actions for rating albums/tracks
    validation/        # Zod schemas shared by client forms + server actions
    db.ts              # Prisma client singleton
prisma/
  schema.prisma        # full data model
  seed.ts
```

As reviews, comments, diary, lists, social, notifications, discovery,
statistics, and moderation get built out, each gets its own folder under
`src/lib/<domain>/` following the same `actions.ts` + co-located test
pattern as `src/lib/ratings/`.

### Why a modular monolith

Everything runs as one Next.js app talking to one Postgres database via
Prisma. Domain folders keep concerns separated without the operational
overhead of microservices this product doesn't need yet. The API routes
under `src/app/api/` are the seam a future native mobile client would
call.

### The MusicProvider seam

Nothing outside `src/lib/music/` knows the catalog is Spotify. Search,
album/artist detail, new releases, and trending all go through the
`MusicProvider` interface (`src/lib/music/provider.ts`). Swapping in
MusicBrainz, blending sources, or adding a fallback when Spotify
rate-limits is a change in one file (`src/lib/music/index.ts`), not a
rewrite.

External IDs (`Album.spotifyId`, etc.) are always stored separately from
our internal `id` (a `cuid`), so re-matching a catalog record or adding a
second provider never breaks a foreign key elsewhere in the schema.

## Roadmap (spec's 12 phases)

1. ✅ Foundation + design system
2. ✅ Auth + users — remaining: email verification, avatar upload
3. ✅ Music data — Spotify provider done; consider a MusicBrainz fallback
4. 🟡 Albums/artists/tracks — album page done; no dedicated artist page yet
5. ✅ Ratings + reviews — rating, review composer, edit/delete, likes,
   comments (action layer) all done; report-content UI still missing
6. ✅ Diary + lists — logging, calendar view, list CRUD, likes done;
   drag-to-reorder UI still missing
7. ✅ Social graph + feed — follow/unfollow, block, profile stats done;
   feed doesn't yet filter out blocked users' content
8. 🟡 Discover + search — top-rated/new-releases/trending + catalog search
   done; "recommended for you" / "hidden gems" not started
9. 🟡 Notifications — write-side done (rows get created); no inbox UI
10. ⬜ Statistics + recommendations — not started
11. 🟡 Moderation — schema + report/action models done; no UI
12. ⬜ Performance + SEO + testing hardening — SEO metadata/JSON-LD done on
    album/list pages; full E2E suite not started

## Testing

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
