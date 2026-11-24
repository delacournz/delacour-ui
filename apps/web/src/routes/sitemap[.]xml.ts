import { createFileRoute } from "@tanstack/react-router";
import { MARKETING_PATHS, sitemapXml } from "@/lib/sitemap";
import { source } from "@/lib/source";

/**
 * Every page a search engine should index: the marketing routes, then every docs
 * page from the same Fumadocs source `/llms.txt` reads — so a page that exists is
 * listed, and one that moved is not.
 */
export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET() {
				const docs = source.getPages().map((page) => page.url);

				return new Response(sitemapXml([...MARKETING_PATHS, ...docs]), {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=300, s-maxage=3600",
					},
				});
			},
		},
	},
});
