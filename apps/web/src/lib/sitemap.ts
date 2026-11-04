import { siteUrl } from "./shared";

/**
 * The routes outside `/docs` a search result should land on. Every docs page is
 * read from the Fumadocs source at request time, so the sitemap cannot go stale
 * the way a hand-written list would — only this short list is written down, and
 * `sitemap.test.ts` pins it.
 */
export const MARKETING_PATHS = ["/", "/compare/heroui", "/theme", "/privacy"] as const;

function escapeXml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * A sitemaps.org `urlset` for the given site-relative paths, deduplicated, in the
 * order given. A path with a query string throws: the only query this site serves
 * is `/theme?preset=`, whose space is effectively infinite and closed in
 * `robots.txt`, and a sitemap listing one would invite the crawl that took the
 * service down.
 */
export function sitemapXml(paths: readonly string[]): string {
	const unique = [...new Set(paths)];
	for (const path of unique) if (path.includes("?")) throw new Error(`sitemap path carries a query: ${path}`);

	const urls = unique.map((path) => `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`).join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
