#!/usr/bin/env bun
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	DELACOUR_ADAPTIVE_INSET,
	DELACOUR_CANVAS,
	DELACOUR_CARD_COLOUR,
	type DelacourIconSvgOptions,
	delacourIconSvg,
} from "@delacour/brand";
import { readIconSource } from "@delacour/brand/source";
/**
 * Rasterises the Delacour app icon from `@delacour/brand`'s master art.
 *
 * The shipped `icon.png` is the authored SVG itself, rendered — not a
 * re-emission of it — so what lands on a home screen is the file a designer
 * edits. The variants iOS and Android additionally want (transparent, tinted,
 * inset into Android's adaptive safe zone) need the art recoloured and rescaled,
 * which a static file cannot do, so those come from `delacourIconSvg()`.
 *
 * The two are held together by an equivalence check: the source SVG and
 * `delacourIconSvg()` at its defaults must rasterise to identical bytes. Edit
 * one without the other and this fails before anything is written. That is the
 * same gate `packages/brand/src/geometry.test.ts` applies from the other side.
 *
 * Run from `apps/playground`: `bun run icons`.
 */
import { Resvg } from "@resvg/resvg-js";

const ASSETS = join(import.meta.dirname, "..", "assets");

/** The light value iOS maps to the user's tint; the system supplies the hue. */
const TINT = "#FFFFFF";

type Variant = { file: string; options: DelacourIconSvgOptions; note: string };

const VARIANTS: Variant[] = [
	{ file: "icon-dark.png", options: { background: null }, note: "ios.icon.dark — iOS draws its own backdrop" },
	{
		file: "icon-tinted.png",
		// Opaque, not transparent: Expo preserves alpha only for the dark
		// variant and flattens the tinted one onto WHITE, which turns a
		// white-on-transparent glyph into a blank square. iOS reads this
		// image's luminance, so a light mark on the dark card is what tints.
		options: { background: DELACOUR_CARD_COLOUR, stroke: TINT },
		note: "ios.icon.tinted — luminance the system tints",
	},
	{
		file: "android-icon-foreground.png",
		options: { background: null, inset: DELACOUR_ADAPTIVE_INSET },
		note: "adaptiveIcon.foregroundImage — inset into the 72/108 safe zone",
	},
	{
		file: "android-icon-monochrome.png",
		options: { background: null, stroke: TINT, inset: DELACOUR_ADAPTIVE_INSET },
		note: "adaptiveIcon.monochromeImage — Android 13+ themed icons",
	},
	// The same options as icon-dark.png, so the two rasterise to identical bytes
	// today. They stay separate files because they answer to different consumers:
	// a change to how iOS wants its dark icon should not silently move what the
	// splash screen draws.
	{
		file: "splash-icon.png",
		options: { background: null },
		note: "expo-splash-screen image — one glyph, both themes",
	},
];

/**
 * Template defaults that nothing references now that the icon is configured.
 *
 * `splash-icon.png` is deliberately not among them any more — `app.config.ts`
 * names it, and a generated asset the config depends on cannot also be one this
 * script deletes. `app.config.test.ts` fails if the two lists ever overlap again.
 */
const STALE = ["favicon.png", "android-icon-background.png"];

function render(svg: string): Buffer {
	return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: DELACOUR_CANVAS } }).render().asPng());
}

function write(file: string, png: Buffer, note: string): void {
	writeFileSync(join(ASSETS, file), png);
	console.log(
		`  ${file.padEnd(30)} ${DELACOUR_CANVAS}×${DELACOUR_CANVAS}  ${(png.length / 1024).toFixed(1)}K  ${note}`
	);
}

const master = render(readIconSource());

if (!master.equals(render(delacourIconSvg()))) {
	console.error(
		"[icons] packages/brand's icon-source.svg and delacourIconSvg() no longer draw the same art.\n" +
			"        Reconcile the SVG with the constants in\n" +
			"        packages/brand/src/geometry.ts before regenerating."
	);
	process.exit(1);
}

console.log("[icons] from @delacour/brand");
write("icon.png", master, "icon + ios.icon.light — full bleed, iOS masks it");
for (const { file, options, note } of VARIANTS) write(file, render(delacourIconSvg(options)), note);

for (const file of STALE) {
	try {
		unlinkSync(join(ASSETS, file));
		console.log(`  removed ${file} (unreferenced Expo template default)`);
	} catch {
		// Already gone — this script is idempotent.
	}
}
