import { z } from "zod";

/** 0.5–5 stars in 0.5 increments — the one rule every rating input must satisfy. */
export const ratingValueSchema = z
  .number()
  .min(0.5, "Rating must be at least 0.5 stars")
  .max(5, "Rating cannot exceed 5 stars")
  .refine((v) => Number.isInteger(v * 2), "Rating must be in 0.5 increments");

export const rateAlbumSchema = z
  .object({
    albumId: z.string().cuid(),
    value: ratingValueSchema,
  })
  .strict();

export const rateTrackSchema = z
  .object({
    trackId: z.string().cuid(),
    value: ratingValueSchema,
  })
  .strict();

export const createReviewSchema = z
  .object({
    albumId: z.string().cuid(),
    rating: ratingValueSchema.optional(),
    body: z.string().min(1, "Review can't be empty").max(10_000),
    containsSpoilers: z.boolean().default(false),
  })
  .strict();

export const createDiaryEntrySchema = z
  .object({
    albumId: z.string().cuid(),
    listenedOn: z.coerce.date(),
    rating: ratingValueSchema.optional(),
    reviewText: z.string().max(10_000).optional(),
    isReListen: z.boolean().default(false),
  })
  .strict();

export type RateAlbumInput = z.infer<typeof rateAlbumSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateDiaryEntryInput = z.infer<typeof createDiaryEntrySchema>;
