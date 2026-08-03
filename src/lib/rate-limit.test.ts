import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitStore } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(resetRateLimitStore);

  it("blocks only after the configured limit and resets after its window", () => {
    const policy = { limit: 2, windowMs: 1_000 };
    expect(checkRateLimit("booking", "127.0.0.1", policy, 1_000).allowed).toBe(true);
    expect(checkRateLimit("booking", "127.0.0.1", policy, 1_100).allowed).toBe(true);
    expect(checkRateLimit("booking", "127.0.0.1", policy, 1_200).allowed).toBe(false);
    expect(checkRateLimit("booking", "127.0.0.1", policy, 2_001).allowed).toBe(true);
  });

  it("keeps scopes and client identities independent", () => {
    const policy = { limit: 1, windowMs: 1_000 };
    checkRateLimit("booking", "one", policy, 1_000);
    expect(checkRateLimit("booking", "two", policy, 1_001).allowed).toBe(true);
    expect(checkRateLimit("availability", "one", policy, 1_001).allowed).toBe(true);
  });
});
