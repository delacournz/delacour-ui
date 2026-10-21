import { tv } from "../../lib/tv";
import type { TextAlign, TextColor } from "../text/text.variants";

export const TEXT_ANIMATION_UNITS = ["character", "word", "line"] as const;
export const TEXT_ANIMATION_ORDERS = ["forward", "reverse", "center", "random"] as const;
export const TEXT_ANIMATION_EFFECT_KINDS = ["fade", "slide", "scale"] as const;
export const TEXT_ANIMATION_CARET_KINDS = ["none", "bar", "block"] as const;
export const TEXT_ANIMATION_SLIDE_DIRECTIONS = ["up", "down", "left", "right"] as const;

/** What one entering piece of a `Reveal` is. */
export type TextAnimationUnit = (typeof TEXT_ANIMATION_UNITS)[number];
/** Which unit enters first. `random` is seeded by the text, so a replay is the same shuffle. */
export type TextAnimationOrder = (typeof TEXT_ANIMATION_ORDERS)[number];
export type TextAnimationEffectKind = (typeof TEXT_ANIMATION_EFFECT_KINDS)[number];
export type TextAnimationCaretKind = (typeof TEXT_ANIMATION_CARET_KINDS)[number];
/** Where a `slide` effect enters from. */
export type TextAnimationSlideFrom = (typeof TEXT_ANIMATION_SLIDE_DIRECTIONS)[number];

/** How a unit arrives. Every kind fades in; `slide` and `scale` add a transform on top. */
export type TextAnimationEffect =
	| { kind: "fade" }
	/** `distance` is in points, default {@link TEXT_ANIMATION_SLIDE_DISTANCE}. */
	| { kind: "slide"; from: TextAnimationSlideFrom; distance?: number }
	/** `from` is the starting scale, default {@link TEXT_ANIMATION_SCALE_FROM}. */
	| { kind: "scale"; from?: number };

/** The typing caret. `blinkMs` is one half-cycle, default {@link TEXT_ANIMATION_BLINK_MS}. */
export type TextAnimationCaret =
	| { kind: "none" }
	| { kind: "bar"; blinkMs?: number }
	| { kind: "block"; blinkMs?: number };

/** How `Rotating` swaps one phrase for the next. `slide` is vertical. */
export type TextAnimationTransition = { kind: "fade" } | { kind: "slide"; distance?: number };

/** How `Counting` and `Rolling` write a number. Hand-written, because a worklet has no `Intl`. */
export type TextAnimationNumberFormat = {
	/** Digits after the separator. Default 0; rounded the way `toFixed` rounds. */
	decimals?: number;
	/** Default `","`. `""` turns grouping off. */
	groupSeparator?: string;
	/** Default `"."`. */
	decimalSeparator?: string;
	/** Written after the sign — `−$5`, not `$−5`. */
	prefix?: string;
	suffix?: string;
};

/** One piece of split text. Whitespace is a unit of its own so a wrapping row can break at it. */
export type TextUnit = { text: string; isSpace: boolean };

export type TypingPhase = "typing" | "holding" | "erasing";

/** One stretch of a typing timeline: a phrase being typed, held or erased. */
export type TypingSegment = {
	phraseIndex: number;
	phase: TypingPhase;
	/** Graphemes in the phrase. */
	length: number;
	startMs: number;
	/** `Infinity` for the hold that ends a timeline which does not loop. */
	endMs: number;
};

/**
 * Every phrase's type, hold and erase laid end to end, built once on the JS
 * thread and sampled every frame on the UI thread.
 */
export type TypingTimeline = {
	segments: readonly TypingSegment[];
	/** The length of one loop; `Infinity` when the timeline does not loop. */
	cycleMs: number;
	loop: boolean;
};

export type TypingSample = { phraseIndex: number; visibleCount: number; phase: TypingPhase };

export type EffectFrame = { opacity: number; translateX: number; translateY: number; scale: number };

export type NumberCell = { kind: "digit"; digit: number } | { kind: "static"; text: string };

export type RollDirection = "up" | "down";

/** Default stagger between units, ms. A character is a small step, so it gets a short one. */
export const TEXT_ANIMATION_STAGGER: Record<TextAnimationUnit, number> = { character: 40, word: 90, line: 90 };
export const TEXT_ANIMATION_DURATION_MS = 420;
export const TEXT_ANIMATION_SLIDE_DISTANCE = 12;
export const TEXT_ANIMATION_SCALE_FROM = 0.8;
export const TEXT_ANIMATION_BLINK_MS = 530;
export const TEXT_ANIMATION_TYPING_SPEED = 22;
export const TEXT_ANIMATION_ERASE_SPEED = 40;
export const TEXT_ANIMATION_HOLD_MS = 1400;
export const TEXT_ANIMATION_ROTATE_INTERVAL_MS = 2200;
export const TEXT_ANIMATION_ROTATE_TRANSITION_MS = 360;
export const TEXT_ANIMATION_ROTATE_DISTANCE = 14;
export const TEXT_ANIMATION_COUNT_DURATION_MS = 900;
export const TEXT_ANIMATION_ROLL_DURATION_MS = 600;
export const TEXT_ANIMATION_ROLL_STAGGER = 40;

/** What a number with no meaning — `NaN`, `±Infinity` — is written as. An em dash. */
export const TEXT_ANIMATION_NO_VALUE = "\u2014";

/**
 * The slots every part draws from.
 *
 * - `row` — a `Reveal`'s units, siblings in a wrapping row. React Native
 *   cannot drive a nested `<Text>`'s style from the UI thread, so units are
 *   siblings rather than runs inside one paragraph.
 * - `word` — a word's characters, held on one line so a word never breaks
 *   mid-glyph when the split is by character.
 * - `lines` — a column of measured lines, for the `line` split.
 * - `measure` — the hidden full paragraph `line` reads its breaks from.
 * - `caret` — the typing caret's box; its colour comes from {@link resolveCaretClass}.
 * - `slot` — `Rotating`'s inline box, sized by its widest phrase.
 * - `layer` — a phrase drawn over that box.
 * - `probe` — a wide, invisible stage the phrases measure on, so none is
 *   clamped to the slot it is being measured to size.
 * - `number` — a numeric part's row; tabular figures so no digit is wider than another.
 * - `wheel` — one odometer digit's window.
 * - `column` — the 0–9 strip that rolls inside it.
 */
export const textAnimationVariants = tv({
	slots: {
		row: "flex-row flex-wrap items-end",
		word: "flex-row",
		lines: "w-full",
		measure: "absolute top-0 right-0 left-0 opacity-0",
		caret: "absolute top-0 bottom-0",
		slot: "relative",
		layer: "absolute top-0 left-0",
		probe: "absolute top-0 left-0 w-[4096px] items-start opacity-0",
		number: "flex-row items-end",
		wheel: "relative overflow-hidden",
		column: "absolute top-0 left-0",
	},
});

/**
 * The caret's classes for a kind and the `Text` colour axis.
 *
 * A token class, never a literal, so the caret follows the theme. A `bar` is a
 * thin column at the right edge of the last typed cell; a `block` is a
 * translucent fill the width of the next glyph.
 */
export function resolveCaretClass(kind: TextAnimationCaretKind, color?: TextColor): string {
	if (kind === "none") return "";
	const fill = CARET_FILL[color ?? "default"];
	return kind === "bar" ? `w-0.5 right-0 ${fill}` : `left-full ${fill}/40`;
}

const CARET_FILL: Record<TextColor, string> = {
	default: "bg-foreground",
	muted: "bg-muted-foreground",
	destructive: "bg-destructive",
	success: "bg-success",
	warning: "bg-warning",
	info: "bg-info",
};

/** A wrapping row has no `textAlign`, so the text's alignment becomes the row's justification. */
export function resolveRowJustify(align: TextAlign | undefined): string {
	if (align === "center") return "justify-center";
	if (align === "right") return "justify-end";
	return "justify-start";
}

/* ------------------------------------------------------------------------- */
/* Splitting                                                                  */
/* ------------------------------------------------------------------------- */

const ZWJ = 0x200d;

/** A code point that never starts a grapheme: it extends whatever came before it. */
function isExtend(cp: number): boolean {
	return (
		(cp >= 0x0300 && cp <= 0x036f) || // combining diacritics
		(cp >= 0x1ab0 && cp <= 0x1aff) ||
		(cp >= 0x1dc0 && cp <= 0x1dff) ||
		(cp >= 0x20d0 && cp <= 0x20ff) || // combining marks for symbols, incl. the keycap
		(cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors
		(cp >= 0xfe20 && cp <= 0xfe2f) ||
		(cp >= 0x1f3fb && cp <= 0x1f3ff) || // skin-tone modifiers
		(cp >= 0xe0020 && cp <= 0xe007f) || // tag characters — subdivision flags
		(cp >= 0xe0100 && cp <= 0xe01ef) ||
		cp === ZWJ ||
		COMBINING_MARK.test(String.fromCodePoint(cp))
	);
}

/** Every other script's combining marks — Devanagari vowel signs, Hebrew points, Thai tone marks. */
const COMBINING_MARK = /\p{M}/u;

function isRegionalIndicator(cp: number): boolean {
	return cp >= 0x1f1e6 && cp <= 0x1f1ff;
}

/**
 * Splits text into user-perceived characters.
 *
 * Hand-written rather than `Intl.Segmenter`, which Hermes does not ship. It
 * covers what a person types into an app: combining accents, emoji with skin
 * tones and variation selectors, ZWJ sequences (a family is one glyph), flag
 * pairs, tag-sequence flags and CR LF. It does not implement Hangul syllable
 * composition from loose jamo, which precomposed text never needs.
 *
 * Kept byte-identical to `ScrollText`'s copy, so moving both to `src/lib/` is a delete.
 */
export function splitGraphemes(text: string): readonly string[] {
	const out: string[] = [];
	let current = "";
	let previous = -1;
	let regionalRun = 0;

	for (const char of text) {
		const cp = char.codePointAt(0) ?? 0;
		const joins =
			current !== "" &&
			(isExtend(cp) ||
				previous === ZWJ ||
				(previous === 0x0d && cp === 0x0a) ||
				(isRegionalIndicator(cp) && isRegionalIndicator(previous) && regionalRun % 2 === 1));

		if (joins) {
			current += char;
		} else {
			if (current !== "") out.push(current);
			current = char;
			regionalRun = 0;
		}
		regionalRun = isRegionalIndicator(cp) ? regionalRun + 1 : 0;
		previous = cp;
	}

	if (current !== "") out.push(current);
	return out;
}

const WHITESPACE = /^\s+$/;

/**
 * Splits text into the units a `Reveal` animates.
 *
 * `word` gives one unit per run of non-space and one per run of whitespace;
 * `character` gives one unit per grapheme, with each whitespace run still a
 * single unit. Whitespace is kept, flagged, so a wrapping row breaks at it.
 *
 * Kept byte-identical to `ScrollText`'s copy, so moving both to `src/lib/` is a delete.
 */
export function splitText(text: string, unit: "character" | "word"): readonly TextUnit[] {
	const out: TextUnit[] = [];
	for (const grapheme of splitGraphemes(text)) {
		const isSpace = WHITESPACE.test(grapheme);
		const last = out[out.length - 1];
		if (last !== undefined && last.isSpace === isSpace && (isSpace || unit === "word")) {
			last.text += grapheme;
		} else {
			out.push({ text: grapheme, isSpace });
		}
	}
	return out;
}

/* ------------------------------------------------------------------------- */
/* Reveal timing                                                              */
/* ------------------------------------------------------------------------- */

/** FNV-1a over UTF-16 code units: a stable integer seed from a string. */
export function hashText(text: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/** mulberry32 — a tiny seeded generator, so `random` is the same shuffle on every replay and every clip. */
function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Each unit's step in the sequence, before it is multiplied by the stagger. */
function resolveStaggerRanks(count: number, order: TextAnimationOrder, seed: number): number[] {
	const ranks = Array.from({ length: count }, (_, i) => i);
	if (order === "reverse") return ranks.map((i) => count - 1 - i);
	if (order === "center") {
		const middle = (count - 1) / 2;
		return ranks.map((i) => Math.floor(Math.abs(i - middle)));
	}
	if (order === "random") {
		const next = seededRandom(seed);
		for (let i = count - 1; i > 0; i--) {
			const j = Math.floor(next() * (i + 1));
			const swap = ranks[i] ?? i;
			ranks[i] = ranks[j] ?? j;
			ranks[j] = swap;
		}
	}
	return ranks;
}

/**
 * Every unit's start delay, in ms, for an order. Computed once per text on the
 * JS thread and handed to each unit as a number, so no frame does this work.
 */
export function resolveStaggerDelays(
	count: number,
	stagger: number,
	order: TextAnimationOrder,
	seed = 0
): readonly number[] {
	return resolveStaggerRanks(count, order, seed).map((rank) => rank * stagger);
}

/** One unit's start delay. See {@link resolveStaggerDelays} for the whole list in one pass. */
export function resolveStaggerDelay(
	index: number,
	count: number,
	stagger: number,
	order: TextAnimationOrder,
	seed = 0
): number {
	return resolveStaggerDelays(count, stagger, order, seed)[index] ?? 0;
}

/** `Easing.out(Easing.cubic)`, restated so the resolver stays free of React Native. */
function easeOutCubic(t: number): number {
	"worklet";
	const inverse = 1 - t;
	return 1 - inverse * inverse * inverse;
}

/**
 * How far one unit has come, 0 → 1, eased out.
 *
 * A pure function of the clock, which is the whole design: one elapsed-ms
 * value drives every unit, so the reveal can be paused, seeked or replayed
 * without starting N animations.
 */
export function resolveUnitProgress(
	elapsedMs: number,
	delayMs: number,
	staggerDelayMs: number,
	durationMs: number
): number {
	"worklet";
	const local = elapsedMs - delayMs - staggerDelayMs;
	if (durationMs <= 0) return local >= 0 ? 1 : 0;
	const linear = Math.min(1, Math.max(0, local / durationMs));
	return easeOutCubic(linear);
}

/**
 * What a unit looks like at progress `t`. Only opacity and transform — a
 * unit's layout is final from the first frame, so nothing reflows as it enters.
 */
export function resolveEffectFrame(effect: TextAnimationEffect, t: number): EffectFrame {
	"worklet";
	const rest = 1 - t;
	if (effect.kind === "slide") {
		const distance = effect.distance ?? TEXT_ANIMATION_SLIDE_DISTANCE;
		const sign = effect.from === "up" || effect.from === "left" ? -1 : 1;
		const offset = sign * distance * rest + 0;
		const isVertical = effect.from === "up" || effect.from === "down";
		return { opacity: t, translateX: isVertical ? 0 : offset, translateY: isVertical ? offset : 0, scale: 1 };
	}
	if (effect.kind === "scale") {
		const from = effect.from ?? TEXT_ANIMATION_SCALE_FROM;
		return { opacity: t, translateX: 0, translateY: 0, scale: from + (1 - from) * t };
	}
	return { opacity: t, translateX: 0, translateY: 0, scale: 1 };
}

/** When the last unit lands: the delay, the latest stagger step, and one duration. */
export function resolveTotalDuration(
	count: number,
	stagger: number,
	durationMs: number,
	delayMs: number,
	order: TextAnimationOrder = "forward"
): number {
	if (count <= 0) return delayMs;
	const lastRank = order === "center" ? Math.floor((count - 1) / 2) : count - 1;
	return delayMs + lastRank * stagger + durationMs;
}

/* ------------------------------------------------------------------------- */
/* Typing                                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Lays every phrase's type → hold → erase end to end.
 *
 * Speeds are characters per second, never a duration for the whole phrase, so
 * a phrase twice as long takes twice as long. With `eraseSpeed` 0 there is no
 * erase: the next phrase replaces the last at the end of its hold. Without
 * `loop` the last phrase's hold never ends.
 */
export function buildTypingTimeline(
	phrases: readonly string[],
	opts: { speed: number; eraseSpeed: number; holdMs: number; loop: boolean }
): TypingTimeline {
	const segments: TypingSegment[] = [];
	let cursor = 0;
	const push = (phraseIndex: number, phase: TypingPhase, length: number, durationMs: number) => {
		segments.push({ phraseIndex, phase, length, startMs: cursor, endMs: cursor + durationMs });
		cursor += durationMs;
	};

	phrases.forEach((phrase, index) => {
		const length = splitGraphemes(phrase).length;
		const isLast = index === phrases.length - 1;
		push(index, "typing", length, opts.speed > 0 ? (length / opts.speed) * 1000 : 0);
		if (isLast && !opts.loop) {
			push(index, "holding", length, Number.POSITIVE_INFINITY);
			return;
		}
		push(index, "holding", length, Math.max(0, opts.holdMs));
		if (opts.eraseSpeed > 0) push(index, "erasing", length, (length / opts.eraseSpeed) * 1000);
	});

	return { segments, cycleMs: opts.loop ? cursor : Number.POSITIVE_INFINITY, loop: opts.loop };
}

/** Where a typing timeline is at a moment. Runs on the UI thread every frame. */
export function sampleTypingTimeline(timeline: TypingTimeline, elapsedMs: number): TypingSample {
	"worklet";
	const { segments } = timeline;
	const t0 = Math.max(0, elapsedMs);
	const t = timeline.loop && timeline.cycleMs > 0 ? t0 % timeline.cycleMs : t0;

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		if (segment === undefined || t >= segment.endMs) continue;
		const span = segment.endMs - segment.startMs;
		const fraction = span > 0 && Number.isFinite(span) ? (t - segment.startMs) / span : 0;
		const stepped = Math.floor(segment.length * fraction);
		const visibleCount =
			segment.phase === "typing" ? stepped : segment.phase === "erasing" ? segment.length - stepped : segment.length;
		return { phraseIndex: segment.phraseIndex, visibleCount, phase: segment.phase };
	}

	return resolveTypingRest(timeline);
}

/** Where a typing timeline comes to rest: the last phrase, typed in full. What calm motion shows. */
export function resolveTypingRest(timeline: TypingTimeline): TypingSample {
	"worklet";
	const last = timeline.segments[timeline.segments.length - 1];
	if (last === undefined) return { phraseIndex: 0, visibleCount: 0, phase: "holding" };
	return { phraseIndex: last.phraseIndex, visibleCount: last.length, phase: "holding" };
}

/** Solid while characters are landing; otherwise on for `blinkMs`, off for `blinkMs`. */
export function resolveCaretOpacity(elapsedMs: number, blinkMs: number, isTyping: boolean): 0 | 1 {
	"worklet";
	if (isTyping || blinkMs <= 0) return 1;
	return Math.floor(Math.max(0, elapsedMs) / blinkMs) % 2 === 0 ? 1 : 0;
}

/* ------------------------------------------------------------------------- */
/* Rotating                                                                   */
/* ------------------------------------------------------------------------- */

/** The phrase after `index`, wrapping when `loop`; `null` when there is nowhere to go. */
export function resolveNextPhrase(index: number, count: number, loop: boolean): number | null {
	if (count <= 1) return null;
	if (index + 1 < count) return index + 1;
	return loop ? 0 : null;
}

/**
 * The phrase likely to be widest, by grapheme count — the first guess at the
 * box a rotating word reserves. The rendered widths settle it after layout.
 */
export function resolveWidestPhrase(phrases: readonly string[]): number {
	let widest = 0;
	let widestLength = -1;
	phrases.forEach((phrase, index) => {
		const length = splitGraphemes(phrase).length;
		if (length > widestLength) {
			widest = index;
			widestLength = length;
		}
	});
	return widest;
}

/* ------------------------------------------------------------------------- */
/* Numbers                                                                    */
/* ------------------------------------------------------------------------- */

/** Thousands-groups a run of whole digits. Left alone when off, or when `toFixed` fell back to exponent form. */
function groupDigits(whole: string, separator: string): string {
	"worklet";
	if (separator === "" || whole.indexOf("e") !== -1) return whole;
	let grouped = "";
	for (let i = 0; i < whole.length; i++) {
		const fromEnd = whole.length - i;
		grouped += whole.charAt(i);
		if (fromEnd > 1 && fromEnd % 3 === 1) grouped += separator;
	}
	return grouped;
}

/**
 * Writes a number with grouping, fixed decimals, a prefix and a suffix.
 *
 * A worklet: `Counting` calls it on the UI thread every frame, where Hermes
 * has no `Intl`, so grouping is done by hand. Rounding is `toFixed`'s, half
 * cases included. A negative takes a true minus sign ahead of the prefix
 * (`−$5`); one that rounds to zero takes none. `NaN` and the infinities are
 * written {@link TEXT_ANIMATION_NO_VALUE}.
 */
export function formatNumber(value: number, format: TextAnimationNumberFormat): string {
	"worklet";
	if (!Number.isFinite(value)) return "\u2014";
	const decimals = Math.max(0, Math.min(20, Math.floor(format.decimals ?? 0)));
	const groupSeparator = format.groupSeparator ?? ",";
	const decimalSeparator = format.decimalSeparator ?? ".";

	const fixed = Math.abs(value).toFixed(decimals);
	const point = fixed.indexOf(".");
	const whole = point === -1 ? fixed : fixed.slice(0, point);
	const fraction = point === -1 ? "" : fixed.slice(point + 1);

	const grouped = groupDigits(whole, groupSeparator);

	const isZero = /^[0.]*$/.test(fixed);
	// U+2212, a true minus — the width of a plus and of a tabular digit — rather than a hyphen.
	const sign = value < 0 && !isZero ? "\u2212" : "";
	const body = fraction === "" ? grouped : `${grouped}${decimalSeparator}${fraction}`;
	return `${sign}${format.prefix ?? ""}${body}${format.suffix ?? ""}`;
}

/**
 * Where a wheel at cumulative position `currentPos` rolls to reach `digit`.
 *
 * The position is cumulative, not 0–9, so 9 → 0 on the way up is 9 → 10 —
 * forward through the wrap rather than back through 8…1. Never a full turn.
 */
export function resolveRollTarget(currentPos: number, digit: number, direction: RollDirection): number {
	const base = Math.round(currentPos);
	const current = ((base % 10) + 10) % 10;
	const delta = direction === "up" ? (digit - current + 10) % 10 : -((current - digit + 10) % 10);
	return base + delta;
}

/** Wheels roll up when the value grows or holds, down when it shrinks. */
export function resolveRollDirection(previous: number, next: number): RollDirection {
	return next < previous ? "down" : "up";
}

/**
 * A cumulative wheel position as an offset into its 0–9-then-0 column, in
 * [0, 10). The trailing 0 is what lets 9 → 10 roll on into a zero.
 */
export function resolveWheelOffset(position: number): number {
	"worklet";
	return ((position % 10) + 10) % 10;
}

/** A formatted number as wheels and static cells: each digit rolls, separators and signs do not. */
export function splitNumberCells(formatted: string): readonly NumberCell[] {
	const cells: NumberCell[] = [];
	for (const char of formatted) {
		const code = char.charCodeAt(0);
		if (code >= 48 && code <= 57) cells.push({ kind: "digit", digit: code - 48 });
		else cells.push({ kind: "static", text: char });
	}
	return cells;
}
