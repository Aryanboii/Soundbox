import { describe, it, expect } from "vitest";
import { ratingValueSchema, createReviewSchema } from "./rating";

describe("ratingValueSchema", () => {
  it("accepts valid half-star values", () => {
    for (const v of [0.5, 1, 1.5, 2, 3.5, 5]) {
      expect(ratingValueSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects values below 0.5", () => {
    expect(ratingValueSchema.safeParse(0).success).toBe(false);
  });

  it("rejects values above 5", () => {
    expect(ratingValueSchema.safeParse(5.5).success).toBe(false);
  });

  it("rejects non-half-star increments", () => {
    expect(ratingValueSchema.safeParse(3.2).success).toBe(false);
    expect(ratingValueSchema.safeParse(2.25).success).toBe(false);
  });
});

describe("createReviewSchema", () => {
  const albumId = "clh1234567890123456789ab"; // cuid-shaped

  it("requires non-empty body", () => {
    expect(
      createReviewSchema.safeParse({ albumId, body: "", containsSpoilers: false }).success,
    ).toBe(false);
  });

  it("accepts a minimal valid review", () => {
    expect(
      createReviewSchema.safeParse({ albumId, body: "Great record.", containsSpoilers: false })
        .success,
    ).toBe(true);
  });

  it("rejects unknown fields (strict mode)", () => {
    expect(
      createReviewSchema.safeParse({
        albumId,
        body: "Great record.",
        containsSpoilers: false,
        userId: "someone-elses-id", // must never be accepted from client input
      }).success,
    ).toBe(false);
  });
});
