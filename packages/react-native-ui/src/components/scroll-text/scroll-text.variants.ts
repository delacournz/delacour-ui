import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** What one animated unit is: a grapheme, a word, or a laid-out line. */
export const SCROLL_TEXT_SPLITS = ["character", "word", "line"] as const;
export type ScrollTextSplit = (typeof SCROLL_TEXT_SPLITS)[number];

/** The four effects, in the order the documentation shows them. */
export const SCROLL_TEXT_EFFECT_KINDS = ["colour", "fade", "rise", "highlight"] as const;
export type ScrollTextEffectKind = (typeof SCROLL_TEXT_EFFECT_KINDS)[number];

/** Theme tokens (raw names, read with `useThemeColor`), never literals. */
export type ScrollTextColor = "foreground" | "muted-foreground" | "primary" | "accent" | "border";

/**
 * How a unit changes as it resolves. Each kind names only the fields it reads, so
 * a `distance` on a fade is a type error rather than a prop that silently does
 * nothing.
 */
export type ScrollTextEffect =
	/** Colour travels between two tokens. Default `muted-foreground` → `foreground`. */
	| { kind: "colour"; from?: ScrollTextColor; to?: ScrollTextColor }
	/** Opacity rises from `from`, default and minimum 0.15. */
	| { kind: "fade"; from?: number }
	/** Rises `distance` points into place (default 14) while fading up from `from`. */
	| { kind: "rise"; distance?: number; from?: number }
	/** A band behind the unit fills from `from` (default nothing) to `color` (default `primary` at 20%). */
	| { kind: "highlight"; color?: ScrollTextColor; from?: ScrollTextColor };

/** Viewport fractions (0 top .. 1 bottom) of the block's TOP edge: 0 progress at `start`, 1 at `end`. */
export type ScrollTextWindow = { start: number; end: number };

/** One piece of the split string. Whitespace is a unit too, flagged, so the pieces join back to the input. */
export type TextUnit = { text: string; isSpace: boolean };

/** A unit that animates, and its place in the reveal order. */
export type ScrollTextIndexedUnit = { text: string; index: number };

/**
 * One child of the rendered block.
 *
 * - `word` — a `nowrap` run of units: one unit for `split="word"`, its graphemes for
 *   `split="character"`, so a word never breaks mid-glyph.
 * - `line` — one laid-out line, for `split="line"`.
 * - `break` — a newline in the source. `isBlank` marks the second and later in a
 *   run, which have to hold a line's height to read as a blank line.
 */
export type ScrollTextGroup =
	| { kind: "word"; units: readonly ScrollTextIndexedUnit[] }
	| { kind: "line"; unit: ScrollTextIndexedUnit }
	| { kind: "break"; isBlank: boolean };

export type ScrollTextLayout = { groups: readonly ScrollTextGroup[]; count: number };

/** Where the reveal starts and ends when the caller names no window. */
export const SCROLL_TEXT_DEFAULT_WINDOW: ScrollTextWindow = { start: 0.85, end: 0.35 };

/** 0 = one after another, 1 = all together. */
export const SCROLL_TEXT_DEFAULT_OVERLAP = 0.4;

/** The dimmest a unit is ever drawn: un-revealed text stays legible to someone scrolling slowly. */
export const SCROLL_TEXT_MIN_OPACITY = 0.15;

/** How far a `rise` unit starts below its place, in points. */
export const SCROLL_TEXT_RISE_DISTANCE = 14;

/** The default highlight's strength — `primary` at full alpha would bury the text it marks. */
export const SCROLL_TEXT_HIGHLIGHT_ALPHA = 0.2;

/**
 * The block's parts.
 *
 * `row` is the wrapping layout every word and character unit sits in; `align` maps
 * onto `justify-*` there because the units are siblings, not runs of one `Text`,
 * so `text-center` on them would centre each word inside itself. `column` is the
 * line layout's equivalent. `measure` is the hidden `Text` the block reads its
 * lines and its space width from — out of flow, so it never adds height, and
 * transparent rather than unmounted, so it keeps measuring at the live width.
 * `space` is the same, shrink-wrapped, so its width is one space glyph's.
 */
export const scrollTextVariants = tv({
	slots: {
		root: "relative",
		row: "flex-row flex-wrap items-start",
		column: "flex-col",
		word: "flex-row",
		break: "h-0 w-full",
		band: "rounded-sm",
		measure: "absolute top-0 right-0 left-0 opacity-0",
		space: "absolute top-0 left-0 opacity-0",
	},
	variants: {
		align: {
			left: { row: "justify-start", column: "items-start" },
			center: { row: "justify-center", column: "items-center" },
			right: { row: "justify-end", column: "items-end" },
		},
	},
	defaultVariants: { align: "left" },
});

export type ScrollTextVariantProps = VariantProps<typeof scrollTextVariants>;

/** Whether `\p{M}` compiles here — Hermes and JSC both have it today, but the ranges below cover an engine without. */
const MARK = ((): RegExp | null => {
	try {
		return /^\p{M}$/u;
	} catch {
		return null;
	}
})();

/** Combining-mark blocks, for an engine without Unicode property escapes. */
const MARK_RANGES: readonly (readonly [number, number])[] = [
	[0x0300, 0x036f],
	[0x0483, 0x0489],
	[0x0591, 0x05bd],
	[0x0610, 0x061a],
	[0x064b, 0x065f],
	[0x0900, 0x0903],
	[0x093a, 0x094f],
	[0x0e31, 0x0e31],
	[0x0e34, 0x0e3a],
	[0x0e47, 0x0e4e],
	[0x1ab0, 0x1aff],
	[0x1dc0, 0x1dff],
	[0x20d0, 0x20ff],
	[0x3099, 0x309a],
	[0xfe20, 0xfe2f],
];

const ZWJ = 0x200d;

function inRange(code: number, low: number, high: number): boolean {
	return code >= low && code <= high;
}

function isCombiningMark(char: string, code: number): boolean {
	if (MARK) return MARK.test(char);
	return MARK_RANGES.some(([low, high]) => inRange(code, low, high));
}

/** A code point that attaches to whatever came before it rather than starting a grapheme. */
function isExtender(char: string, code: number): boolean {
	return (
		code === ZWJ ||
		inRange(code, 0xfe00, 0xfe0f) ||
		inRange(code, 0xe0100, 0xe01ef) ||
		inRange(code, 0x1f3fb, 0x1f3ff) ||
		inRange(code, 0xe0020, 0xe007f) ||
		isCombiningMark(char, code)
	);
}

function isRegionalIndicator(code: number): boolean {
	return inRange(code, 0x1f1e6, 0x1f1ff);
}

/**
 * Splits a string into user-perceived characters.
 *
 * Hand-written rather than `Intl.Segmenter` so every engine splits the same way —
 * Hermes has shipped without the segmenter, and a unit count that differs per
 * platform is a stagger that differs per platform. It covers what text on a phone
 * actually holds: combining marks, variation selectors, skin tones, ZWJ sequences,
 * flag pairs, tag sequences, keycaps and CRLF. Hangul jamo sequences and the rarer
 * extended rules are out of scope; precomposed Hangul is one code point already.
 */
export function splitGraphemes(text: string): readonly string[] {
	const graphemes: string[] = [];
	let current = "";
	let previous = -1;
	let regionalRun = 0;

	for (const char of text) {
		const code = char.codePointAt(0) ?? 0;
		const joins =
			current !== "" &&
			((previous === 0x0d && code === 0x0a) ||
				previous === ZWJ ||
				isExtender(char, code) ||
				(isRegionalIndicator(code) && regionalRun % 2 === 1));

		if (joins) {
			current += char;
		} else {
			if (current !== "") graphemes.push(current);
			current = char;
			regionalRun = 0;
		}

		regionalRun = isRegionalIndicator(code) ? regionalRun + 1 : 0;
		previous = code;
	}

	if (current !== "") graphemes.push(current);
	return graphemes;
}

const WHITESPACE = /^\s+$/;
const WHITESPACE_RUNS = /\s+|\S+/g;

/**
 * Splits a string into units, whitespace included and flagged.
 *
 * The contract is fixed and shared with the timed text animations: joining the
 * units' `text` gives the input back, `word` keeps a run of whitespace as one unit,
 * and `character` splits by grapheme, never by UTF-16 code unit.
 */
export function splitText(text: string, unit: "character" | "word"): readonly TextUnit[] {
	if (unit === "word") {
		return (text.match(WHITESPACE_RUNS) ?? []).map((part) => ({ text: part, isSpace: WHITESPACE.test(part) }));
	}

	return splitGraphemes(text).map((grapheme) => ({ text: grapheme, isSpace: WHITESPACE.test(grapheme) }));
}

/**
 * Turns the lines a `Text` reported from `onTextLayout` into units.
 *
 * Each line arrives with its trailing space or newline still attached; drawn on a
 * line of its own that would push a centred or right-aligned line off true, so it
 * is trimmed. A line that is nothing but whitespace is a blank line, flagged as a
 * space so it holds its height without taking a place in the reveal.
 */
export function splitLines(lines: readonly string[]): readonly TextUnit[] {
	return lines.map((line) => {
		const text = line.replace(/\s+$/, "");
		return { text, isSpace: text === "" };
	});
}

const NEWLINE = /\r\n|\r|\n/g;

/**
 * Arranges split units into what the block renders, and numbers the ones that animate.
 *
 * Whitespace is dropped — the row's measured `columnGap` stands in for it — except
 * a newline, which becomes a `break`. Only drawn units take an index, so a
 * paragraph's stagger is spread over its words rather than over its spaces too.
 */
export function resolveScrollTextLayout(units: readonly TextUnit[], split: ScrollTextSplit): ScrollTextLayout {
	return split === "line" ? layoutLines(units) : layoutWords(units, split === "character");
}

/** One single-line unit per line; a blank line keeps its height as a break. */
function layoutLines(units: readonly TextUnit[]): ScrollTextLayout {
	const groups: ScrollTextGroup[] = [];
	let count = 0;
	for (const unit of units) {
		if (unit.isSpace) groups.push({ kind: "break", isBlank: true });
		else groups.push({ kind: "line", unit: { text: unit.text, index: count++ } });
	}
	return { groups, count };
}

/** The breaks a whitespace run makes: one per newline, the second and later blank. */
function breaksOf(space: string): ScrollTextGroup[] {
	const newlines = space.match(NEWLINE)?.length ?? 0;
	return Array.from({ length: newlines }, (_, line) => ({ kind: "break", isBlank: line > 0 }));
}

/** Words as groups; graphemes, when `isCharacters`, gathered into their word's group. */
function layoutWords(units: readonly TextUnit[], isCharacters: boolean): ScrollTextLayout {
	const groups: ScrollTextGroup[] = [];
	let count = 0;
	let word: ScrollTextIndexedUnit[] | null = null;

	for (const unit of units) {
		if (unit.isSpace) {
			word = null;
			groups.push(...breaksOf(unit.text));
			continue;
		}

		const indexed = { text: unit.text, index: count++ };
		if (isCharacters && word !== null) {
			word.push(indexed);
		} else {
			word = [indexed];
			groups.push({ kind: "word", units: word });
		}
	}

	return { groups, count };
}

function isValidWindow(window: ScrollTextWindow): boolean {
	"worklet";
	return Number.isFinite(window.start) && Number.isFinite(window.end) && window.start > window.end;
}

/** The caller's window, or the default when it is missing or runs the wrong way (`start <= end`). */
export function resolveScrollTextWindow(window?: ScrollTextWindow): ScrollTextWindow {
	"worklet";
	return window && isValidWindow(window) ? window : SCROLL_TEXT_DEFAULT_WINDOW;
}

function clamp01(value: number): number {
	"worklet";
	return Math.min(1, Math.max(0, value));
}

/**
 * How far the block is through its window, from the page position of its top edge.
 *
 * `clamp((start·vh − top) / ((start − end)·vh))` — 0 while the top sits at or
 * below `start`, 1 once it reaches `end`, and pinned there past it so text the
 * reader has scrolled beyond stays revealed. No viewport yet reads as 0.
 */
export function resolveScrollProgress(top: number, viewportHeight: number, window: ScrollTextWindow): number {
	"worklet";
	if (!(viewportHeight > 0)) return 0;
	const { start, end } = resolveScrollTextWindow(window);
	return clamp01((start * viewportHeight - top) / ((start - end) * viewportHeight));
}

/**
 * One unit's own progress, staggered across the block's.
 *
 * Each unit gets a slot of `span = 1 / (1 + (n−1)(1−overlap))`, and slots start
 * `span·(1−overlap)` apart, so the last one ends exactly at 1. `overlap = 1` is
 * every unit together; `0` is strictly one after another. Every effect reads
 * this and nothing else.
 */
export function resolveRevealProgress(progress: number, index: number, count: number, overlap: number): number {
	"worklet";
	if (count <= 1) return clamp01(progress);
	const spread = 1 - clamp01(overlap);
	const span = 1 / (1 + (count - 1) * spread);
	const step = span * spread;
	return clamp01((progress - index * step) / span);
}

/** Opacity, never below the legible floor. */
function floorOpacity(from: number | undefined): number {
	"worklet";
	return Math.min(1, Math.max(SCROLL_TEXT_MIN_OPACITY, from ?? SCROLL_TEXT_MIN_OPACITY));
}

/** Where an un-revealed unit sits: its opacity and how far below its place. */
export function resolveEffectFloor(effect: ScrollTextEffect): { opacity: number; translate: number } {
	"worklet";
	switch (effect.kind) {
		case "fade":
			return { opacity: floorOpacity(effect.from), translate: 0 };
		case "rise":
			return { opacity: floorOpacity(effect.from), translate: effect.distance ?? SCROLL_TEXT_RISE_DISTANCE };
		default:
			return { opacity: 1, translate: 0 };
	}
}

/** How far a unit rises — nothing under reduce motion, and nothing for an effect that does not rise. */
export function resolveRiseDistance(effect: ScrollTextEffect, isReduceMotion: boolean): number {
	"worklet";
	if (isReduceMotion || effect.kind !== "rise") return 0;
	return effect.distance ?? SCROLL_TEXT_RISE_DISTANCE;
}

/**
 * A unit at local progress `t`.
 *
 * `colorT` drives a `colour` effect's text colour and `fillT` a `highlight`'s band;
 * each is 0 for every other kind, so the unit's animated style can read all four
 * fields without branching on the effect.
 */
export function resolveEffectFrame(
	effect: ScrollTextEffect,
	t: number,
	isReduceMotion = false
): { opacity: number; translate: number; colorT: number; fillT: number } {
	"worklet";
	const progress = clamp01(t);
	const floor = resolveEffectFloor(effect);
	const distance = resolveRiseDistance(effect, isReduceMotion);

	return {
		opacity: floor.opacity + (1 - floor.opacity) * progress,
		translate: distance * (1 - progress),
		colorT: effect.kind === "colour" ? progress : 0,
		fillT: effect.kind === "highlight" ? progress : 0,
	};
}

/**
 * The two tokens an effect reads colour from.
 *
 * `undefined` where an effect draws no colour of its own — a fade or rise keeps
 * the text's class colour — and for a highlight's `from` left unset, which the
 * caller turns into the band's own colour at zero alpha. `isDefaultHighlight`
 * marks the one case drawn at {@link SCROLL_TEXT_HIGHLIGHT_ALPHA}: a colour the
 * caller names is drawn at full strength, because naming it was the choice.
 */
export function resolveScrollTextColorTokens(effect: ScrollTextEffect): {
	from: ScrollTextColor | undefined;
	to: ScrollTextColor | undefined;
	isDefaultHighlight: boolean;
} {
	switch (effect.kind) {
		case "colour":
			return { from: effect.from ?? "muted-foreground", to: effect.to ?? "foreground", isDefaultHighlight: false };
		case "highlight":
			return { from: effect.from, to: effect.color ?? "primary", isDefaultHighlight: effect.color === undefined };
		default:
			return { from: undefined, to: undefined, isDefaultHighlight: false };
	}
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)(?:,\s*([^)]+))?\)$/i;

function alphaByte(alpha: number): string {
	return Math.round(clamp01(alpha) * 255)
		.toString(16)
		.padStart(2, "0");
}

/**
 * A colour with its alpha multiplied by `alpha`.
 *
 * Theme colours reach JavaScript as hex — Uniwind formats every resolved colour
 * that way — so hex is the case that matters; `rgb()`/`rgba()` are covered for a
 * literal. Anything else passes through unchanged rather than guessed at.
 */
export function withAlpha(color: string | undefined, alpha: number): string | undefined {
	if (!color) return undefined;

	if (HEX.test(color)) {
		const digits = color.slice(1);
		const expanded =
			digits.length <= 4
				? digits
						.split("")
						.map((digit) => digit + digit)
						.join("")
				: digits;
		const base = expanded.slice(0, 6);
		const existing = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
		return `#${base}${alphaByte(existing * alpha)}`;
	}

	const channels = RGB.exec(color);
	if (channels) {
		const existing = channels[4] === undefined ? 1 : Number.parseFloat(channels[4]);
		const next = Math.round(clamp01(existing * alpha) * 1000) / 1000;
		return `rgba(${channels[1]?.trim()}, ${channels[2]?.trim()}, ${channels[3]?.trim()}, ${next})`;
	}

	return color;
}
