import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123", 12);

  const alice = await db.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      username: "alice",
      displayName: "Alice",
      passwordHash,
      bio: "Vinyl collector. Bad opinions about jazz fusion.",
    },
  });

  const artist = await db.artist.upsert({
    where: { spotifyId: "seed-artist-1" },
    update: {},
    create: { spotifyId: "seed-artist-1", name: "The Midnight Verses" },
  });

  const album = await db.album.upsert({
    where: { spotifyId: "seed-album-1" },
    update: {},
    create: {
      spotifyId: "seed-album-1",
      title: "Amber Hours",
      artistId: artist.id,
      releaseDate: new Date("2023-06-02"),
    },
  });

  await db.rating.upsert({
    where: { userId_albumId: { userId: alice.id, albumId: album.id } },
    update: {},
    create: { userId: alice.id, albumId: album.id, value: 4.5 },
  });

  await db.review.upsert({
    where: { userId_albumId: { userId: alice.id, albumId: album.id } },
    update: {},
    create: {
      userId: alice.id,
      albumId: album.id,
      rating: 4.5,
      body: "A quiet, patient record — rewards a late-night, headphones-on listen.",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => db.$disconnect());
