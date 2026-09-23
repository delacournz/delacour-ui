import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/shared";

/**
 * Nothing here is private, so the file exists for one reason: to name
 * `/llms.txt` somewhere a crawler already looks. Without it, the only way to
 * find the index is to already know the convention.
 *
 * **`/theme?` is disallowed.** Every builder tile links to the theme one axis
 * away, as a fresh `?preset=` code, so the query space is every combination of
 * every axis — effectively infinite. Googlebot, GoogleOther and GPTBot walked it
 * at ~40 requests a second, and that crawl was ~99% of the service's egress.
 * `/theme` itself, the named presets' landing, stays crawlable.
 *
 * No `Sitemap:` line. Prerendering is off, so nothing produces a page list at
 * build time, and a hand-written sitemap is a transcription that would go stale
 * the first time a page moved.
 */
const BODY = `User-agent: *
Allow: /
Disallow: /theme?

# Every page on this site, as plain Markdown:
#   ${siteUrl}/llms.txt         an index of every page
#   ${siteUrl}/llms-full.txt    every page's full content
#   <any docs URL>.md                         that one page
`;

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET() {
				return new Response(BODY, {
					headers: { "Content-Type": "text/plain; charset=utf-8" },
				});
			},
		},
	},
});
