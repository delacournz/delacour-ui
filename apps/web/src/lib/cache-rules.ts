/**
 * Short browser lifetime, an hour at a shared cache, for everything the server renders. Content only
 * changes on deploy, so a stale copy is never wrong for long, and a CDN in front
 * can answer repeat (and crawler) requests without touching the process.
 */
export const PAGE_CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

const PAGE_ROUTES = [
	"/",
	"/docs",
	"/docs/**",
	"/compare/**",
	"/privacy",
	"/theme",
	"/llms.txt",
	"/llms-full.txt",
	"/robots.txt",
	"/api/search",
	"/skills/**",
] as const;

/** Nitro `routeRules` entries, one per rendered route. `/assets` and `/previews` are handled apart. */
export const pageCacheRules: Record<string, { headers: { "cache-control": string } }> = Object.fromEntries(
	PAGE_ROUTES.map((route) => [route, { headers: { "cache-control": PAGE_CACHE_CONTROL } }])
);
