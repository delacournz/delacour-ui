#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import { join } from "node:path";
/**
 * Rasterises the docs site's browser icon set from `@delacour/brand`.
 *
 * The same master art the playground rasterises into launcher PNGs, in the
 * shapes a browser asks for. Three treatments, and which one a file gets is
 * decided by who masks it:
 *
 * - **Rounded.** `favicon.svg`, `favicon.ico` and the `purpose: "any"` PWA
 *   icons. Nothing masks these, so the corners have to be in the art.
 * - **Full bleed.** `apple-touch-icon.png` only. iOS applies its own squircle;
 *   rounding it first ships a double-rounded icon with pale corners.
 * - **Inset.** `icon-maskable-512.png`. Android crops a maskable icon to
 *   whatever shape the launcher wants, so the glyph sits inside the same safe
 *   zone the adaptive Android icon uses and the card runs to the edge.
 *
 * Run from `apps/web`: `bun run icons`. Output is committed — `build` never
 * regenerates it.
 */
import { DELACOUR_ADAPTIVE_INSET, DELACOUR_CORNER_RADIUS, delacourIconSvg } from "@delacour/brand";
import { Resvg } from "@resvg/resvg-js";

const PUBLIC = join(import.meta.dirname, "..", "public");

/** The sizes packed into `favicon.ico`, smallest first. */
const ICO_SIZES = [16, 32, 48] as const;

function render(svg: string, size: number): Buffer {
	return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng());
}

/**
 * Packs PNGs into an ICO container.
 *
 * PNG-compressed entries rather than BMP ones: every browser in the support
 * matrix reads them, and a 48px BMP entry is four times the size for no gain.
 * A dimension of 256 or more is written as 0, which is the format's way of
 * saying "read it from the image itself".
 */
function ico(images: Buffer[], sizes: readonly number[]): Buffer {
	const HEADER = 6;
	const ENTRY = 16;

	const header = Buffer.alloc(HEADER);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);

	let offset = HEADER + ENTRY * images.length;
	const entries = images.map((png, index) => {
		const entry = Buffer.alloc(ENTRY);
		const size = sizes[index] ?? 0;
		entry.writeUInt8(size >= 256 ? 0 : size, 0);
		entry.writeUInt8(size >= 256 ? 0 : size, 1);
		entry.writeUInt8(0, 2);
		entry.writeUInt8(0, 3);
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(png.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += png.length;
		return entry;
	});

	return Buffer.concat([header, ...entries, ...images]);
}

function write(file: string, data: Buffer | string, note: string): void {
	writeFileSync(join(PUBLIC, file), data);
	console.log(`  ${file.padEnd(24)} ${(Buffer.byteLength(data) / 1024).toFixed(1).padStart(6)}K  ${note}`);
}

const rounded = delacourIconSvg({ corner: DELACOUR_CORNER_RADIUS });

console.log("[icons] from @delacour/brand");
write("favicon.svg", rounded, "rel=icon — every modern browser, at any size");
write(
	"favicon.ico",
	ico(
		ICO_SIZES.map((size) => render(rounded, size)),
		ICO_SIZES
	),
	`${ICO_SIZES.join("/")} — legacy tabs and pinned shortcuts`
);
write("icon-192.png", render(rounded, 192), "manifest — purpose any");
write("icon-512.png", render(rounded, 512), "manifest — purpose any, install prompt");
write(
	"icon-maskable-512.png",
	render(delacourIconSvg({ inset: DELACOUR_ADAPTIVE_INSET }), 512),
	"manifest — purpose maskable, glyph in the safe zone"
);
write("apple-touch-icon.png", render(delacourIconSvg(), 180), "iOS home screen — full bleed, iOS masks it");
