import type { VariantProps } from "tailwind-variants";
import { isLiteralColor } from "../../lib/color";
import { DELACOUR_DEFAULT_LABELS, type SketchLabels } from "../../lib/labels";
import { tv } from "../../lib/tv";
import { isSafeSketchColor, type SketchItem, type SketchShape, type SketchTool } from "./sketch.paths";

/** The swatches a sketch offers when it is given none — the ink, then the five status hues. */
export const SKETCH_DEFAULT_COLORS = ["foreground", "destructive", "warning", "success", "info", "primary"] as const;

/** Stroke width in points. */
export const SKETCH_MIN_SIZE = 1;
export const SKETCH_DEFAULT_SIZE = 4;
export const SKETCH_MAX_SIZE = 24;

/** The theme token the export paints behind the drawing unless told otherwise. */
export const SKETCH_EXPORT_BACKGROUND = "background";

/** @deprecated Read `labels.size` from `Sketch`'s `labels` prop or `DelacourProvider`'s `labels`. */
export const SKETCH_SIZE_LABEL = DELACOUR_DEFAULT_LABELS.sketch.size;

/**
 * Every tool and shape, as a `Record` over both unions: a shape added to
 * `SKETCH_SHAPES` fails the typecheck here until it is listed, and then fails
 * again where `labels.tool` takes it until the catalog's `SketchToolName` names it.
 */
const SKETCH_NAME_KEYS: Record<SketchTool | SketchShape, true> = {
	arrow: true,
	diamond: true,
	ellipse: true,
	eraser: true,
	heart: true,
	line: true,
	pen: true,
	rectangle: true,
	shape: true,
	star: true,
	triangle: true,
};

/**
 * What a tool or a shape is called, to a screen reader and in the docs, in English.
 *
 * @deprecated Read `labels.tool(name)` from `Sketch`'s `labels` prop or
 * `DelacourProvider`'s `labels`. Kept so existing imports keep working.
 */
export const SKETCH_LABELS = Object.fromEntries(
	(Object.keys(SKETCH_NAME_KEYS) as (SketchTool | SketchShape)[]).map((name) => [
		name,
		DELACOUR_DEFAULT_LABELS.sketch.tool(name),
	])
) as Record<SketchTool | SketchShape, string>;

/** A swatch's drawn edge in points: `size-button-sm`, pinned to `tokens.css` by a test. */
export const SKETCH_SWATCH_EDGE_PT = 36;

/** The swatches row's gap in points. Pinned to the `gap-*` class by a test. */
export const SKETCH_SWATCH_GAP_PT = 4;

/** The most hit slop a swatch takes on a side: half the gap. A swatch reaches 40 of 44. */
export const SKETCH_SWATCH_SLOP_CAP = SKETCH_SWATCH_GAP_PT / 2;

/** Every slot `sketchVariants` returns, for a test that has to walk all of them. */
export const SKETCH_SLOTS = [
	"root",
	"canvas",
	"toolbar",
	"toolbarRow",
	"swatches",
	"swatch",
	"swatchRing",
	"swatchDot",
	"divider",
] as const;

/**
 * Styling for a sketch and its toolbar.
 *
 * One slotted `tv()` because the canvas, the toolbar and the swatches are
 * separate files that cannot import the root (AGENTS.md rule 3).
 *
 * - **The canvas is a card**: `bg-card`, a hairline `border-border`, the card
 *   corner and `overflow-hidden`, so ink drawn to the edge is clipped by the
 *   corner rather than painted over it.
 * - **The toolbar is ruled off the canvas**, on the same fill, in the screen
 *   gutter. Disabled fades the toolbar and never the canvas — the marks are
 *   content, and stay readable.
 * - **A swatch is a 36pt target around a 24pt dot.** The ring around the dot
 *   always reserves its border and only colours it when selected, so selecting
 *   a swatch moves nothing. 36pt is the one target here under 44 — six swatches
 *   have to fit a 360pt row with the gutter taken off. Hit slop capped at half the gap
 *   takes it to 40.
 *
 * Free of React Native imports so it stays unit-testable.
 */
export const sketchVariants = tv({
	slots: {
		root: "flex-col gap-3",
		canvas: "flex-1 overflow-hidden rounded-lg border border-border border-continuous bg-card",
		toolbar: "gap-2 border-t border-border bg-card px-screen-gutter py-2",
		toolbarRow: "flex-row items-center gap-1",
		swatches: "flex-row flex-wrap items-center gap-1",
		swatch: "size-button-sm items-center justify-center rounded-full",
		swatchRing: "items-center justify-center rounded-full border-2 p-0.5",
		swatchDot: "size-icon-xl rounded-full",
		divider: "mx-1 h-6 w-px bg-border",
	},
	variants: {
		isSelected: {
			true: { swatchRing: "border-ring" },
			false: { swatchRing: "border-transparent" },
		},
		isDisabled: {
			true: { toolbar: "opacity-50" },
			false: {},
		},
	},
	defaultVariants: {
		isDisabled: false,
		isSelected: false,
	},
});

export type SketchVariantProps = VariantProps<typeof sketchVariants>;

/**
 * The ink a swatch draws with, as a literal.
 *
 * A literal passes through; a token is looked up in `tokens`, the values the
 * active theme resolved. Anything that is not a safe colour once resolved —
 * an unknown token, a `url(…)` — is `undefined`, which a caller reads as "skip
 * this swatch". Ink is never drawn as `undefined`.
 */
export function resolveSketchColor(
	color: string,
	tokens: Readonly<Record<string, string | undefined>>
): string | undefined {
	const resolved = isLiteralColor(color) ? color : tokens[color];
	if (resolved === undefined || !isSafeSketchColor(resolved)) return undefined;
	return resolved;
}

/**
 * A stroke width inside the slider's range.
 *
 * `NaN` falls back to the default width before clamping, and a reversed range
 * is swapped rather than collapsing every value to one end.
 */
export function clampSketchSize(n: number, min: number, max: number): number {
	const low = Math.min(min, max);
	const high = Math.max(min, max);
	const value = Number.isFinite(n) ? n : SKETCH_DEFAULT_SIZE;
	return Math.min(Math.max(value, low), high);
}

/**
 * The canvas's accessible label: whether there is anything, and how much.
 *
 * It does not describe the drawing — nothing could, honestly — and an eraser
 * counts as a mark, because undo removes it as one.
 */
export function resolveSketchAccessibilityLabel(
	items: readonly SketchItem[],
	labels: SketchLabels = DELACOUR_DEFAULT_LABELS.sketch
): string {
	return labels.drawing(items.length);
}

/** The canvas's spoken actions: undo and clear, offered only while there is something to reverse and the sketch is live. */
export function resolveSketchAccessibilityActions(
	items: readonly SketchItem[],
	isDisabled: boolean,
	labels: SketchLabels = DELACOUR_DEFAULT_LABELS.sketch
): { label: string; name: "undo" | "clear" }[] {
	if (isDisabled || items.length === 0) return [];
	return [
		{ label: labels.undo, name: "undo" },
		{ label: labels.clear, name: "clear" },
	];
}

/**
 * A swatch's accessible name.
 *
 * A token names itself (`muted-foreground` → "Muted foreground"). A literal
 * has no name a screen reader could say usefully, so it is read by position.
 */
export function resolveSwatchLabel(
	color: string,
	index: number,
	total: number,
	labels: SketchLabels = DELACOUR_DEFAULT_LABELS.sketch
): string {
	if (isLiteralColor(color)) return labels.swatchPosition(index + 1, total);
	return labels.swatchToken(color.replace(/^--/, "").split("-").join(" "));
}

/**
 * The theme tokens a sketch has to read to turn its colours into ink.
 *
 * The export's surfaces come first — `background`, its default, and `card`, the
 * canvas's own fill — then each token swatch once. Literals need no lookup. One
 * array, because a hook cannot be called once per swatch: the swatch count is
 * data.
 */
export function sketchTokenNames(colors: readonly string[]): string[] {
	const names = [SKETCH_EXPORT_BACKGROUND, "card"];
	for (const color of colors) {
		if (!isLiteralColor(color) && !names.includes(color)) names.push(color);
	}
	return names;
}

/** One swatch the toolbar draws: the colour as given, the ink it resolved to, and its name. */
export type SketchSwatch = { color: string; ink: string; label: string };

/**
 * The swatches a toolbar offers, resolved against the active theme.
 *
 * A colour that resolves to nothing is dropped rather than drawn as an empty
 * dot — see {@link resolveSketchColor} — and a repeated colour appears once, so
 * two swatches can never be selected together. A literal is labelled by its
 * place in the list the caller gave, which is the list they can see in code.
 */
export function resolveSketchSwatches(
	colors: readonly string[],
	tokens: Readonly<Record<string, string | undefined>>,
	labels: SketchLabels = DELACOUR_DEFAULT_LABELS.sketch
): SketchSwatch[] {
	const swatches: SketchSwatch[] = [];
	colors.forEach((color, index) => {
		if (swatches.some((swatch) => swatch.color === color)) return;
		const ink = resolveSketchColor(color, tokens);
		if (ink === undefined) return;
		swatches.push({ color, ink, label: resolveSwatchLabel(color, index, colors.length, labels) });
	});
	return swatches;
}

/**
 * The literal `toSVG` paints behind the drawing.
 *
 * Omitted, the theme's `background` at export time — so a drawing in near-white
 * ink on a dark theme stays legible as a file. `null` is transparent. A token
 * resolves only if the sketch read it (`sketchTokenNames`): `background`,
 * `card` or one of its swatches. Anything else is transparent rather than wrong.
 */
export function resolveSketchExportBackground(
	background: string | null | undefined,
	tokens: Readonly<Record<string, string | undefined>>
): string | null {
	if (background === null) return null;
	return resolveSketchColor(background ?? SKETCH_EXPORT_BACKGROUND, tokens) ?? null;
}
