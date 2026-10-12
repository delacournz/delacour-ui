import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";
import { type DocsProduct, isDocsProduct } from "@/lib/seo";
import { type OgProof, ogCardSvg } from "@/og/card";
import regularUrl from "@/og/jetbrains-mono-400.ttf?inline";
import semiBoldUrl from "@/og/jetbrains-mono-600.ttf?inline";
import captureUrl from "../../../public/previews/screen/showcase/dark.png?inline";

/**
 * `/og/docs?title=Button` — a 1200×630 PNG for the social card.
 * `&product=charts` or `&product=bottom-sheet` draws that package's card instead of the
 * library's; `isDocsProduct` is the one place a product name is checked, so a fourth product
 * needs an entry in `PRODUCTS` and nothing here.
 *
 * The SVG comes from `og/card.ts` and resvg rasterises it here, on the server,
 * with the two weights of the one face the card sets. resvg reads fonts from
 * paths only, and the built server has no `node_modules/@expo-google-fonts`
 * beside it, so each TTF is bundled as an inline data URL and written to the
 * temp directory once per process — the same bytes the site loads from Google Fonts, committed
 * under `src/og/` so the card cannot depend on a network fetch at render time.
 *
 * The library's card stands a real capture in its phone — `screen/showcase`,
 * the hero's device, dark — bundled the same way, as an inline data URL, read
 * from the committed file `bun run previews` writes, so a recapture reaches
 * the card with the next build and the server needs no `public/` beside it.
 *
 * Rendered cards are memoised by title; a scraper fetches each once and the
 * set of titles is the set of docs pages. The cap is a guard against a URL
 * fuzzer, not a working limit.
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

function render(product: DocsProduct, title: string | undefined): Uint8Array {
	const key = `${product}:${title ?? ""}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const proof: OgProof | undefined = product === "ui" ? { kind: "device", href: captureUrl } : undefined;
	const png = new Resvg(ogCardSvg({ product, title, proof }), {
		font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: "JetBrains Mono" },
	})
		.render()
		.asPng();

	if (cache.size >= CACHE_LIMIT) cache.clear();
	cache.set(key, png);
	return png;
}

export const Route = createFileRoute("/og/docs")({
	server: {
		handlers: {
			GET({ request }) {
				const params = new URL(request.url).searchParams;
				const title = params.get("title")?.slice(0, 200) ?? undefined;
				const requested = params.get("product");
				const product: DocsProduct = isDocsProduct(requested) ? requested : "ui";
				const png = render(product, title || undefined);

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
