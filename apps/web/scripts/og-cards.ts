#!/usr/bin/env bun
/**
 * Renders the social card of every docs page that opens on a preview, plus
 * each product's default, so the set can be looked at before any of it ships.
 *
 *     bun run og-cards                  # everything, into <repo>/node_modules/.temp/og/
 *     bun run og-cards -- --only dialog # pages whose path contains "dialog"
 *
 * The output is under `node_modules/`, which is ignored, so nothing here can
 * be committed by accident. `index.html` beside the PNGs lays them out on one
 * page.
 *
 * A page's proof is its hero — the first `<Preview id>` in its MDX — read from
 * the committed capture `bun run previews` wrote. A `stage` capture is used as
 * it is. A `device` capture is not: every one of them is a clip that opens on
 * the closed state, so its poster is a screen with one button on it. `MOMENTS`
 * names, per clip, the moment worth a card and which end of the screen the
 * card should keep, and `ffmpeg` cuts that frame out of the dark clip.
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { type DocsProduct, docsProduct, PRODUCTS } from "@/lib/seo";
import { type OgProof, ogCardSvg } from "@/og/card";
import { type PreviewEntry, type PreviewId, previews } from "@/previews/manifest";

const WEB = join(import.meta.dir, "..");
const CONTENT = join(WEB, "content/docs");
const PUBLIC = join(WEB, "public");
const OUT = join(WEB, "../../node_modules/.temp/og");
const FRAMES = join(OUT, ".frames");
const FONTS = ["jetbrains-mono-400.ttf", "jetbrains-mono-600.ttf"].map((name) => join(WEB, "src/og", name));

type Moment = {
	/** How far through the clip the frame is, 0–1. */
	at: number;
	/** Which end of the screen the card keeps — see `OgProof`. */
	anchor: "top" | "bottom";
};

/** The poster is the right frame, and the top of the screen is the part to keep. */
const POSTER: Moment = { at: 0, anchor: "top" };

/** The frame of each device clip that shows what the page is about. */
const MOMENTS: Partial<Record<PreviewId, Moment>> = {
	"screen/showcase": POSTER,
	"screen/inbox": POSTER,
	"bottom-sheet/anatomy/the-whole-composition": { at: 0.24, anchor: "bottom" },
	"context-menu/message-actions": { at: 0.55, anchor: "bottom" },
	"dialog/confirm": { at: 0.3, anchor: "top" },
	"drawer/navigation": { at: 0.3, anchor: "top" },
	"feedback/basic": { at: 0.8, anchor: "top" },
	"menu/actions": { at: 0.6, anchor: "bottom" },
	"popover/basic": { at: 0.6, anchor: "top" },
	"toast/statuses": { at: 0.3, anchor: "bottom" },
	"tooltip/icon-buttons": { at: 0.35, anchor: "top" },
	"bottom-sheet-engine/anatomy/two-snap-points": { at: 0.3, anchor: "top" },
	"bottom-sheet-engine/detached/floating-card": { at: 0.3, anchor: "bottom" },
	"bottom-sheet-engine/footer/sticky-on-a-short-sheet": { at: 0.45, anchor: "bottom" },
	"bottom-sheet-engine/keyboard/interactive-with-sticky-footer": { at: 0.3, anchor: "top" },
	"bottom-sheet-engine/portal/two-sheets-stacked": { at: 0.6, anchor: "top" },
	"bottom-sheet-engine/scrollables/scroll-view-two-snap-points": { at: 0.3, anchor: "top" },
	"bottom-sheet-engine/steps/three-step-form": { at: 0.5, anchor: "top" },
};

/** The capture a product's card stands on when the page has no hero of its own. */
const PRODUCT_PROOF: Record<DocsProduct, PreviewId> = {
	ui: "screen/showcase",
	charts: "charts/animation/morph",
	"bottom-sheet": "bottom-sheet-engine/anatomy/two-snap-points",
};

type Card = {
	/** Where the PNG goes, relative to `OUT`, without the extension. */
	file: string;
	product: DocsProduct;
	title?: string;
	subtitle?: string;
	preview: PreviewId;
};

function isPreviewId(id: string): id is PreviewId {
	return Object.hasOwn(previews, id);
}

function dataUrl(bytes: Uint8Array): string {
	return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
}

/** The dark poster's path on disk, from the manifest's cache-busted URL. */
function mediaPath(url: string): string {
	return join(PUBLIC, url.replace(/\?.*$/, ""));
}

async function frame(entry: PreviewEntry, moment: Moment): Promise<Uint8Array> {
	if (moment.at === 0 || !entry.dark.video || !entry.durationMs) return readFile(mediaPath(entry.dark.poster));

	const out = join(FRAMES, `${entry.id.replaceAll("/", "_")}.png`);
	const seconds = ((entry.durationMs * moment.at) / 1000).toFixed(3);
	const ffmpeg = Bun.spawn(
		["ffmpeg", "-v", "error", "-y", "-ss", seconds, "-i", mediaPath(entry.dark.video), "-frames:v", "1", out],
		{ stderr: "inherit" }
	);
	if ((await ffmpeg.exited) !== 0) throw new Error(`ffmpeg could not cut ${entry.id} at ${seconds}s`);
	return readFile(out);
}

async function proof(id: PreviewId): Promise<OgProof> {
	const entry: PreviewEntry = previews[id];

	if (entry.frame === "stage") {
		const href = dataUrl(await readFile(mediaPath(entry.dark.poster)));
		return { kind: "stage", href, width: entry.width, height: entry.height };
	}

	const moment = MOMENTS[id];
	if (!moment) throw new Error(`${id} is a device clip with no entry in MOMENTS`);
	return { kind: "device", href: dataUrl(await frame(entry, moment)), anchor: moment.anchor };
}

async function mdxFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true, recursive: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
		.map((entry) => join(entry.parentPath, entry.name))
		.sort();
}

function frontmatter(source: string, key: string): string | undefined {
	const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
	return block
		.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]
		?.trim()
		.replace(/^(["'])(.*)\1$/, "$2");
}

/** A page's card, or the reason it has none of its own. */
async function pageCard(path: string): Promise<Card | string> {
	const source = await readFile(path, "utf8");
	const slugs = relative(CONTENT, path)
		.replace(/\.mdx$/, "")
		.split("/")
		.filter((slug) => slug !== "index");
	const hero = source.match(/<Preview id="([^"]+)"/)?.[1];
	if (!hero) return "no preview on the page";
	if (!isPreviewId(hero)) return `names ${hero}, which is not in the manifest`;

	const product = docsProduct(slugs);
	const isLanding = product !== "ui" && slugs.length === 1;

	return {
		file: slugs.join("/"),
		product,
		title: isLanding ? undefined : frontmatter(source, "title"),
		subtitle: isLanding ? undefined : frontmatter(source, "description"),
		preview: hero,
	};
}

async function render(card: Card): Promise<void> {
	const svg = ogCardSvg({
		product: card.product,
		title: card.title,
		subtitle: card.subtitle,
		proof: await proof(card.preview),
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
await mkdir(FRAMES, { recursive: true });

const defaults: Card[] = (Object.keys(PRODUCTS) as DocsProduct[]).map((product) => ({
	file: `_default/${product}`,
	product,
	preview: PRODUCT_PROOF[product],
}));
const cards: Card[] = [...defaults];
const skipped: [string, string][] = [];

for (const path of await mdxFiles(CONTENT)) {
	const page = relative(CONTENT, path);
	const card = await pageCard(path);
	if (typeof card === "string") skipped.push([page, card]);
	else cards.push(card);
}

const wanted = only ? cards.filter((card) => card.file.includes(only)) : cards;
for (const card of wanted) await render(card);

await rm(FRAMES, { recursive: true, force: true });
await writeFile(join(OUT, "index.html"), indexHtml(wanted, skipped));

console.log(`${wanted.length} cards → ${OUT}`);
console.log(`${skipped.length} pages have no hero and take their product's default`);
