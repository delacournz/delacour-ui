import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";
import { ogCardSvg } from "@/og/card";
import interUrl from "@/og/inter-400.ttf?inline";
import outfitUrl from "@/og/outfit-600.ttf?inline";

/**
 * `/og/docs?title=Button` — a 1200×630 PNG for the social card.
 *
 * The SVG comes from `og/card.ts` and resvg rasterises it here, on the server,
 * with the two faces the card sets. resvg reads fonts from paths only, and the
 * built server has no `node_modules/@expo-google-fonts` beside it, so the two
 * TTFs are bundled as inline data URLs and written to the temp directory once
 * per process — the same bytes the site loads from Google Fonts, committed
 * under `src/og/` so the card cannot depend on a network fetch at render time.
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
	const outfit = join(dir, "outfit-600.ttf");
	const inter = join(dir, "inter-400.ttf");
	writeFileSync(outfit, decodeDataUrl(outfitUrl));
	writeFileSync(inter, decodeDataUrl(interUrl));

	fontFiles = [outfit, inter];
	return fontFiles;
}

function render(title: string | undefined): Uint8Array {
	const key = title ?? "";
	const cached = cache.get(key);
	if (cached) return cached;

	const png = new Resvg(ogCardSvg({ title }), {
		font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: "Inter" },
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
				const title = new URL(request.url).searchParams.get("title")?.slice(0, 200) ?? undefined;
				const png = render(title || undefined);

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
