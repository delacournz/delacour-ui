import { describe, expect, test } from "bun:test";
import { createSiteLimiter, RATE_LIMIT_PREFIX, siteLimiter } from "./rate-limit";

describe("createSiteLimiter", () => {
	test("counts in-process with no RATE_LIMIT_REDIS_URL and keys under the site's prefix", async () => {
		const limiter = createSiteLimiter(undefined);
		const policy = { max: 1, windowMs: 60_000 };
		expect(await limiter.limit("k", policy)).toMatchObject({ allowed: true, key: `${RATE_LIMIT_PREFIX}:k:60000` });
		expect((await limiter.limit("k", policy)).allowed).toBe(false);
	});

	test("the shared limiter is one instance", () => {
		expect(siteLimiter()).toBe(siteLimiter());
	});

	test("an unreachable Redis degrades to in-process counting rather than failing the request", async () => {
		// Nothing listens here; `enableOfflineQueue: false` makes the first hit fail at once.
		const limiter = createSiteLimiter("redis://127.0.0.1:1/0");
		const policy = { max: 1, windowMs: 60_000 };
		expect((await limiter.limit("k", policy)).allowed).toBe(true);
		expect((await limiter.limit("k", policy)).allowed).toBe(false);
	});
});
