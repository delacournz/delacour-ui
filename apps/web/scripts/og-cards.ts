#!/usr/bin/env bun
/**
 * Renders the social card of every docs page that opens on a preview, plus
 * each product's default, so the set can be looked at in one place.
 *
 *     bun run og-cards                  # everything, into <repo>/node_modules/.temp/og/
 *     bun run og-cards -- --only dialog # pages whose path contains "dialog"
 *
 * The output is under `node_modules/`, which is ignored, so nothing here can
 * be committed by accident. `index.html` beside the PNGs lays them out on one
 * page.
 *
 * These are the cards `/og/docs` serves: the same `og/page.ts` picks the
 * capture and the words, and the same committed files are read — a poster from
 * `public/previews/`, or a frame `bun run og-assets` cut into `src/og/frames/`.
 * Run that first after changing a moment in `MOMENTS`.
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { type DocsProduct, PRODUCTS } from "@/lib/seo";
import { type OgCard, ogCardSvg } from "@/og/card";
import { readPages } from "@/og/content";
import { capturePath, cardCopy, PRODUCT_HERO, proofOf } from "@/og/page";
import type { PreviewId } from "@/previews/manifest";

const WEB = join(import.meta.dir, "..");
const OUT = join(WEB, "../../node_modules/.temp/og");
const FONTS = ["jetbrains-mono-400.ttf", "jetbrains-mono-600.ttf"].map((name) => join(WEB, "src/og", name));

type Card = Pick<OgCard, "product" | "title" | "subtitle"> & {
	/** Where the PNG goes, relative to `OUT`, without the extension. */
	file: string;
	preview: PreviewId;
};

async function render(card: Card): Promise<void> {
	const bytes = await readFile(join(WEB, capturePath(card.preview)));
	const href = `data:image/png;base64,${bytes.toString("base64")}`;
	const svg = ogCardSvg({
		product: card.product,
		title: card.title,
		subtitle: card.subtitle,
		proof: proofOf(card.preview, href),
	});
	const png = new Resvg(svg, {
		font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "JetBrains Mono" },
	})
		.render()
		.asPng();
	const out = join(OUT, `${card.file}.png`);

	await mkdir(join(out, ".."), { recursive: true });
	await writeFile(out, png);
}

function indexHtml(cards: Card[], skipped: [string, string][]): string {
	const figures = cards
		.map(
			(card) =>
				`<figure><img loading="lazy" src="${card.file}.png" width="600" height="315"><figcaption>${card.file} <span>${card.preview}</span></figcaption></figure>`
		)
		.join("\n");
	const rows = skipped.map(([page, reason]) => `<li>${page} <span>${reason}</span></li>`).join("\n");

	return `<!doctype html>
<meta charset="utf-8">
<title>Social cards</title>
<style>
	body { margin: 24px; background: #0a0a0a; color: #f5f5f5; font: 13px ui-monospace, monospace; }
	main { display: grid; grid-template-columns: repeat(auto-fill, minmax(600px, 1fr)); gap: 24px; }
	figure { margin: 0; }
	img { display: block; width: 100%; height: auto; border: 1px solid #262626; }
	figcaption, li { padding-top: 8px; }
	span { color: #737373; }
</style>
<h1>${cards.length} cards</h1>
<main>
${figures}
</main>
<h2>${skipped.length} pages on their product's default card</h2>
<ul>
${rows}
</ul>
`;
}

const onlyAt = process.argv.indexOf("--only");
const only = onlyAt === -1 ? undefined : process.argv[onlyAt + 1];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const defaults: Card[] = (Object.keys(PRODUCTS) as DocsProduct[]).map((product) => ({
	file: `_default/${product}`,
	product,
	preview: PRODUCT_HERO[product],
}));
const cards: Card[] = [...defaults];
const skipped: [string, string][] = [];

for (const page of await readPages()) {
	if (page.hero) cards.push({ ...cardCopy(page, true), file: page.key, preview: page.hero });
	else skipped.push([page.key, "no preview on the page"]);
}

const wanted = only ? cards.filter((card) => card.file.includes(only)) : cards;
for (const card of wanted) await render(card);

await writeFile(join(OUT, "index.html"), indexHtml(wanted, skipped));

console.log(`${wanted.length} cards → ${OUT}`);
console.log(`${skipped.length} pages have no hero and take their product's default`);
