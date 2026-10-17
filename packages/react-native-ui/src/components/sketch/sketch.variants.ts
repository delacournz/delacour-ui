import type { VariantProps } from "tailwind-variants";
import { isLiteralColor } from "../../lib/color";
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

/** The size slider's accessible name. */
export const SKETCH_SIZE_LABEL = "Stroke width";

/**
 * What a tool or a shape is called, to a screen reader and in the docs.
 *
 * A `Record` over both unions, so a shape added to `SKETCH_SHAPES` fails the
 * typecheck here until someone names it — a toolbar button with no label is a
 * button VoiceOver reads as "button".
 */
export const SKETCH_LABELS = {
	arrow: "Arrow",
	diamond: "Diamond",
	ellipse: "Ellipse",
	eraser: "Eraser",
	heart: "Heart",
	line: "Line",
	pen: "Pen",
	rectangle: "Rectangle",
	shape: "Shape",
	star: "Star",
	triangle: "Triangle",
} as const satisfies Record<SketchTool | SketchShape, string>;

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
 *   have to fit a 360pt row with the gutter taken off.
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
export function resolveSketchAccessibilityLabel(items: readonly SketchItem[]): string {
	if (items.length === 0) return "Drawing, empty";
	return `Drawing, ${items.length} ${items.length === 1 ? "mark" : "marks"}`;
}

/**
 * A swatch's accessible name.
 *
 * A token names itself (`muted-foreground` → "Muted foreground"). A literal
 * has no name a screen reader could say usefully, so it is read by position.
 */
export function resolveSwatchLabel(color: string, index: number, total: number): string {
	if (isLiteralColor(color)) return `Colour ${index + 1} of ${total}`;
	const words = color.replace(/^--/, "").split("-").join(" ");
	return words.charAt(0).toUpperCase() + words.slice(1);
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
	tokens: Readonly<Record<string, string | undefined>>
): SketchSwatch[] {
	const swatches: SketchSwatch[] = [];
	colors.forEach((color, index) => {
		if (swatches.some((swatch) => swatch.color === color)) return;
		const ink = resolveSketchColor(color, tokens);
		if (ink === undefined) return;
		swatches.push({ color, ink, label: resolveSwatchLabel(color, index, colors.length) });
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
