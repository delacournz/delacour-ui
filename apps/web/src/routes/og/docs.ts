import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";
import { type DocsProduct, docsProduct, isDocsProduct } from "@/lib/seo";
import { source } from "@/lib/source";
import { type OgCard, ogCardSvg } from "@/og/card";
import { captures, pageHeroes } from "@/og/heroes";
import regularUrl from "@/og/jetbrains-mono-400.ttf?inline";
import semiBoldUrl from "@/og/jetbrains-mono-600.ttf?inline";
import { cardCopy, PRODUCT_HERO, pageKey, proofOf } from "@/og/page";
import type { PreviewId } from "@/previews/manifest";

/**
 * `/og/docs?page=native/components/button` — a 1200×630 PNG for the social card
 * of one docs page. The page is all the URL names: its title, its line and the
 * capture in its phone are looked up here, so a card exists only for a page
 * that does. Bare, the route is the library's default card.
 *
 * `?title=` and `?product=` are the query this route took before a card was a
 * page's own. Links shared then still carry it, so it still answers: that
 * product's default capture under the title asked for.
 *
 * The SVG comes from `og/card.ts` and resvg rasterises it here, on the server,
 * with the two weights of the one face the card sets. resvg reads fonts from
 * paths only, and the built server has no `node_modules/@expo-google-fonts`
 * beside it, so each TTF is bundled as an inline data URL and written to the
 * temp directory once per process — the same bytes the site loads from Google Fonts, committed
 * under `src/og/` so the card cannot depend on a network fetch at render time.
 *
 * The capture is bundled the same way and for the same reason — the server
 * needs no `public/` beside it — but on demand: `og/heroes.ts` holds one lazy
 * import per capture, so a card loads its own image and not the other sixty-nine.
 * `og/page.ts` says which capture a page gets.
 *
 * Rendered cards are memoised by query; a scraper fetches each once and the
 * set of pages is finite. The cap is a guard against a URL fuzzer, not a
 * working limit.
 */

const CACHE_LIMIT = 256;
const cache = new Map<string, Uint8Array>();

let fontFiles: string[] | undefined;

function decodeDataUrl(url: string): Buffer {
	const comma = url.indexOf(",");
	return Buffer.from(url.slice(comma + 1), "base64");
}

function fonts(): string[] {
	if (fontFiles) return fontFiles;

	const dir = join(tmpdir(), "delacour-og-fonts");
	mkdirSync(dir, { recursive: true });
	const faces = { "jetbrains-mono-400.ttf": regularUrl, "jetbrains-mono-600.ttf": semiBoldUrl };

	fontFiles = Object.entries(faces).map(([name, url]) => {
		const path = join(dir, name);
		writeFileSync(path, decodeDataUrl(url));
		return path;
	});
	return fontFiles;
}

async function render(
	key: string,
	copy: Pick<OgCard, "product" | "title" | "subtitle">,
	hero: PreviewId
): Promise<Uint8Array> {
	const cached = cache.get(key);
	if (cached) return cached;

	const capture = await captures[hero]?.load();
	const proof = capture ? proofOf(hero, capture.default) : undefined;
	const png = new Resvg(ogCardSvg({ ...copy, proof }), {
		font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: "JetBrains Mono" },
	})
		.render()
		.asPng();

	if (cache.size >= CACHE_LIMIT) cache.clear();
	cache.set(key, png);
	return png;
}

/** The card of the page `?page=` names, or nothing when no such page exists. */
function pageCard(key: string | null): Promise<Uint8Array> | undefined {
	const page = key ? source.getPage(key.split("/")) : undefined;
	if (!page) return undefined;

	const slugs = page.slugs;
	const hero = pageHeroes[pageKey(slugs)];
	const copy = cardCopy({ slugs, title: page.data.title, description: page.data.description }, hero !== undefined);

	return render(`page:${pageKey(slugs)}`, copy, hero ?? PRODUCT_HERO[docsProduct(slugs)]);
}

function legacyCard(params: URLSearchParams): Promise<Uint8Array> {
	const title = params.get("title")?.slice(0, 200) || undefined;
	const requested = params.get("product");
	const product: DocsProduct = isDocsProduct(requested) ? requested : "ui";

	return render(`${product}:${title ?? ""}`, { product, title }, PRODUCT_HERO[product]);
}

export const Route = createFileRoute("/og/docs")({
	server: {
		handlers: {
			async GET({ request }) {
				const params = new URL(request.url).searchParams;
				const png = await (pageCard(params.get("page")) ?? legacyCard(params));

				return new Response(Buffer.from(png), {
					headers: {
						"content-type": "image/png",
						"cache-control": "public, max-age=86400, s-maxage=604800",
					},
				});
			},
		},
	},
});
