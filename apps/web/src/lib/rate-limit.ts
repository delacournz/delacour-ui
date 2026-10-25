import {
	createMemoryStore,
	createRateLimiter,
	createRedisStore,
	RATE_LIMIT_REDIS_OPTIONS,
	type RateLimiter,
	type RateLimitStore,
} from "@delacournz/rate-limit";
import { Redis } from "ioredis";

/** Every key this site writes starts with this, so it never shares a window with another product on the same Redis. */
export const RATE_LIMIT_PREFIX = "ui-web";

/**
 * The site's one limiter, over the shared `rate-limit-redis` service when `RATE_LIMIT_REDIS_URL`
 * is set (Railway, both channels — `apps/ui/infra/railway.ts` in delacour-monorepo wires it) and
 * over this process's memory otherwise (local dev, tests, a build).
 *
 * Why Redis for a one-replica site: the counters outlive a restart and a deploy, a second replica
 * would share them rather than double every ceiling, and — the reason it exists — the fleet that
 * took the site down on 2026-10-25 is visible as one thing only in a store every request reaches.
 * While Redis is unreachable the limiter counts in-process instead (the package's fallback), so a
 * Redis outage degrades to today's posture, never to no limiting and never to a 500.
 *
 * ioredis, with the package's options: `enableOfflineQueue: false` and a short `commandTimeout`
 * keep a dead Redis off the request path. `connect()` is started here rather than on the first
 * request, because with no offline queue the first command before the socket is up would fail
 * into the fallback for nothing. The `error` listener is not optional — under Bun an unhandled
 * ioredis `error` event ends the process.
 */
export function createSiteLimiter(url: string | undefined = process.env.RATE_LIMIT_REDIS_URL): RateLimiter {
	return createRateLimiter({
		store: url ? redisStore(url) : createMemoryStore(),
		prefix: RATE_LIMIT_PREFIX,
		onStoreError: ({ state, error }) => {
			if (state === "degraded") console.error("[rate-limit] redis unavailable, counting in-process", error);
			else console.log("[rate-limit] redis recovered");
		},
	});
}

function redisStore(url: string): RateLimitStore {
	const redis = new Redis(url, RATE_LIMIT_REDIS_OPTIONS);
	redis.on("error", (error) => console.error("[rate-limit] redis error", error));
	void redis.connect().catch(() => undefined);
	return createRedisStore(redis);
}

let shared: RateLimiter | undefined;

/** The process-wide limiter, built on first use so importing this module has no side effect. */
export function siteLimiter(): RateLimiter {
	shared ??= createSiteLimiter();
	return shared;
}
