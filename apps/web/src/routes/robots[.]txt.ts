import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/shared";

/**
 * Nothing here is private, so the file exists for one reason: to name
 * `/llms.txt` somewhere a crawler already looks. Without it, the only way to
 * find the index is to already know the convention.
 *
 * No `Sitemap:` line. Prerendering is off, so nothing produces a page list at
 * build time, and a hand-written sitemap is a transcription that would go stale
 * the first time a page moved.
 */
const BODY = `User-agent: *
Allow: /

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
