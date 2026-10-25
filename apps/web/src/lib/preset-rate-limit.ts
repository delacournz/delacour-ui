import { clientAddress, type RateLimitDecision, type RateLimiter, type RateLimitPolicy } from "@delacournz/rate-limit";

/**
 * The ceilings on `/theme?preset=` pages the server will render.
 *
 * The builder's controls are `<Link>`s to a route with no loader, so a person clicking through it
 * navigates in the client and the server never hears about it: the only server request for a
 * `?preset=` URL is the first load, a paste, or a reload. A crawler that ignores
 * `Disallow: /theme?` loads each one fresh instead. From 2026-10-16 a headless fleet did exactly
 * that, 10–30k pages an hour, every one a CDN miss (the query string is part of the cache key) and
 * a full server render. It sends no crawler user agent, and it is not in Meta's range, so
 * `crawler-block.ts` cannot name it.
 *
 * - **`perAddress`** — thirty loads in ten minutes is far past anything a reader does and far
 *   below that crawl.
 * - **`total`** — the ceiling the per-address count cannot be. On 2026-10-25 a fleet rotated 400+
 *   addresses, each under thirty loads, rendered at ~37 a second, and had the service down for
 *   twenty hours. Six hundred in ten minutes is one a second — more preset pages than this site's
 *   readers load in a day, and a hard bound on what a fleet of any size can make the process
 *   render. Past it, every `?preset=` load is a `429` until the window turns, whoever asks.
 *
 * Both are counted in `@delacournz/rate-limit`'s store — the shared Redis on Railway, this
 * process's memory elsewhere (`src/lib/rate-limit.ts`). The bare `/theme`, the presets' landing,
 * is never counted. A request with no edge-reported address (local dev, tests) is never counted
 * either: `clientAddress` reads Railway's `X-Real-IP`, trusts `CF-Connecting-IP` over it only when
 * that hop is a Cloudflare address, and never reads `X-Forwarded-For`.
 */
export const PRESET_RATE_LIMIT = {
	perAddress: { max: 30, windowMs: 10 * 60 * 1000 },
	total: { max: 600, windowMs: 10 * 60 * 1000 },
} as const satisfies { perAddress: RateLimitPolicy; total: RateLimitPolicy };

export function isPresetPageRequest(request: Request): boolean {
	if (request.method !== "GET") return false;
	const url = new URL(request.url);
	return url.pathname === "/theme" && url.searchParams.has("preset");
}

export type PresetLimiter = {
	/**
	 * Charges a `?preset=` page load against both ceilings and returns the refusal to answer with,
	 * or `null` to let the request through. Anything that is not a `?preset=` page load is `null`
	 * without being counted.
	 */
	check(request: Request): Promise<RateLimitDecision | null>;
};

export function createPresetLimiter(
	limiter: RateLimiter,
	{ perAddress, total }: { perAddress: RateLimitPolicy; total: RateLimitPolicy } = PRESET_RATE_LIMIT
): PresetLimiter {
	return {
		async check(request) {
			if (!isPresetPageRequest(request)) return null;
			const address = clientAddress(request.headers);
			if (address === null) return null;

			const decision = await limiter.limitAll([
				{ key: `preset:${address}`, policy: perAddress },
				{ key: "preset:total", policy: total },
			]);
			return decision.allowed ? null : decision;
		},
	};
}
