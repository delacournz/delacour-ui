import { clientIp } from "@/lib/crawler-block";

/**
 * A ceiling on how many `/theme?preset=` pages one IP can load from the server.
 *
 * The builder's controls are `<Link>`s to a route with no loader, so a person clicking through it
 * navigates in the client and the server never hears about it: the only server request for a
 * `?preset=` URL is the first load, a paste, or a reload. A crawler that ignores
 * `Disallow: /theme?` loads each one fresh instead. From 2026-10-16 a headless fleet did exactly
 * that, 10–30k pages an hour, every one a CDN miss (the query string is part of the cache key) and
 * a full server render. It sends no crawler user agent, and it is not in Meta's range, so
 * `crawler-block.ts` cannot name it.
 *
 * Thirty loads in ten minutes is far past anything a reader does and far below that crawl. The
 * counter is a fixed window per `X-Real-IP`, held in this process: `ui-web` runs one replica, so
 * that is the whole service. The map is dropped at each window boundary, which bounds its size to
 * the IPs seen in one window. A request with no `X-Real-IP` (local dev, tests) is never counted.
 */
export const PRESET_RATE_LIMIT = { max: 30, windowMs: 10 * 60 * 1000 } as const;

export function isPresetPageRequest(request: Request): boolean {
	if (request.method !== "GET") return false;
	const url = new URL(request.url);
	return url.pathname === "/theme" && url.searchParams.has("preset");
}

export type PresetLimiter = {
	/** Whether this request is over the ceiling. Counts it if it is a `?preset=` page load. */
	isLimited(request: Request): boolean;
	/** Seconds until the current window ends, for `Retry-After`. */
	retryAfterSeconds(): number;
};

export function createPresetLimiter(
	{ max, windowMs }: { max: number; windowMs: number } = PRESET_RATE_LIMIT,
	now: () => number = Date.now
): PresetLimiter {
	let windowStart = now();
	let counts = new Map<string, number>();

	function roll(): void {
		const t = now();
		if (t - windowStart < windowMs) return;
		windowStart = t;
		counts = new Map();
	}

	return {
		isLimited(request) {
			if (!isPresetPageRequest(request)) return false;
			const ip = clientIp(request);
			if (ip === null) return false;

			roll();
			const count = (counts.get(ip) ?? 0) + 1;
			counts.set(ip, count);
			return count > max;
		},
		retryAfterSeconds() {
			return Math.max(1, Math.ceil((windowStart + windowMs - now()) / 1000));
		},
	};
}

/** A bare `429`. `no-store` for the same reason as `blockCrawlerResponse`: the edge must not cache it. */
export function presetLimitedResponse(retryAfterSeconds: number): Response {
	return new Response("Too Many Requests", {
		status: 429,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "text/plain; charset=utf-8",
			"Retry-After": String(retryAfterSeconds),
		},
	});
}
