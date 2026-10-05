import { describe, expect, test } from "bun:test";
import { TEXT_ALIGNS } from "../text/text.variants";
import {
	resolveEffectFloor,
	resolveEffectFrame,
	resolveRevealProgress,
	resolveRiseDistance,
	resolveScrollProgress,
	resolveScrollTextColorTokens,
	resolveScrollTextLayout,
	resolveScrollTextWindow,
	SCROLL_TEXT_DEFAULT_OVERLAP,
	SCROLL_TEXT_DEFAULT_WINDOW,
	SCROLL_TEXT_EFFECT_KINDS,
	SCROLL_TEXT_HIGHLIGHT_ALPHA,
	SCROLL_TEXT_MIN_OPACITY,
	SCROLL_TEXT_RISE_DISTANCE,
	SCROLL_TEXT_SPLITS,
	type ScrollTextEffect,
	type ScrollTextEffectKind,
	scrollTextVariants,
	splitGraphemes,
	splitLines,
	splitText,
	withAlpha,
} from "./scroll-text.variants";

/** One effect of every kind, at its defaults. */
const DEFAULT_EFFECTS: Record<ScrollTextEffectKind, ScrollTextEffect> = {
	colour: { kind: "colour" },
	fade: { kind: "fade" },
	rise: { kind: "rise" },
	highlight: { kind: "highlight" },
};

const SWEEP = Array.from({ length: 41 }, (_, step) => step / 40);

describe("splitGraphemes", () => {
	test("an empty string has none", () => {
		expect(splitGraphemes("")).toEqual([]);
	});

	test("plain ASCII is one grapheme per character", () => {
		expect(splitGraphemes("abc")).toEqual(["a", "b", "c"]);
	});

	test("a precomposed é is one grapheme", () => {
		expect(splitGraphemes("é")).toEqual(["é"]);
	});

	test("a decomposed e + combining acute is one grapheme", () => {
		expect(splitGraphemes("éx")).toEqual(["é", "x"]);
	});

	test("a ZWJ family stays one grapheme", () => {
		expect(splitGraphemes("👨‍👩‍👧 ok")).toEqual(["👨‍👩‍👧", " ", "o", "k"]);
	});

	test("two flags are two graphemes, each a regional-indicator pair", () => {
		expect(splitGraphemes("🇳🇿🇦🇺")).toEqual(["🇳🇿", "🇦🇺"]);
	});

	test("a skin-tone modifier stays on its emoji", () => {
		expect(splitGraphemes("👍🏽")).toEqual(["👍🏽"]);
	});

	test("a variation selector stays on its base", () => {
		expect(splitGraphemes("❤️!")).toEqual(["❤️", "!"]);
	});

	test("a keycap sequence is one grapheme", () => {
		expect(splitGraphemes("1️⃣2")).toEqual(["1️⃣", "2"]);
	});

	test("CJK is one grapheme per ideograph", () => {
		expect(splitGraphemes("漢字かな")).toEqual(["漢", "字", "か", "な"]);
	});

	test("a CRLF pair is one grapheme", () => {
		expect(splitGraphemes("a\r\nb")).toEqual(["a", "\r\n", "b"]);
	});

	test("joining the graphemes gives the string back", () => {
		for (const text of ["👨‍👩‍👧 ok", "🇳🇿🇦🇺", "é", "漢字 and ascii", "👍🏽👍🏿"]) {
			expect(splitGraphemes(text).join("")).toBe(text);
		}
	});
});

describe("splitText", () => {
	test("an empty string has no units", () => {
		expect(splitText("", "word")).toEqual([]);
		expect(splitText("", "character")).toEqual([]);
	});

	test("word split flags the space between two words", () => {
		expect(splitText("Hi there", "word")).toEqual([
			{ text: "Hi", isSpace: false },
			{ text: " ", isSpace: true },
			{ text: "there", isSpace: false },
		]);
	});

	test("consecutive whitespace stays one unit", () => {
		expect(splitText("a   b", "word")).toEqual([
			{ text: "a", isSpace: false },
			{ text: "   ", isSpace: true },
			{ text: "b", isSpace: false },
		]);
	});

	test("leading and trailing whitespace are units too", () => {
		expect(splitText(" a ", "word").map((unit) => unit.isSpace)).toEqual([true, false, true]);
	});

	test("character split keeps the ZWJ family as one unit", () => {
		expect(splitText("👨‍👩‍👧 ok", "character")).toEqual([
			{ text: "👨‍👩‍👧", isSpace: false },
			{ text: " ", isSpace: true },
			{ text: "o", isSpace: false },
			{ text: "k", isSpace: false },
		]);
	});

	test("character split: two flags are two units, a toned thumb is one", () => {
		expect(splitText("🇳🇿🇦🇺", "character")).toHaveLength(2);
		expect(splitText("👍🏽", "character")).toHaveLength(1);
	});

	test("joining the units gives the string back", () => {
		for (const unit of ["word", "character"] as const) {
			expect(
				splitText("We build  interfaces\nthat move.", unit)
					.map((part) => part.text)
					.join("")
			).toBe("We build  interfaces\nthat move.");
		}
	});
});

describe("splitLines", () => {
	test("each line is one unit with its trailing whitespace trimmed", () => {
		expect(splitLines(["We build ", "interfaces that ", "move."])).toEqual([
			{ text: "We build", isSpace: false },
			{ text: "interfaces that", isSpace: false },
			{ text: "move.", isSpace: false },
		]);
	});

	test("a blank line is a space unit, so it keeps its height but not an index", () => {
		expect(splitLines(["One\n", "\n", "Two"])).toEqual([
			{ text: "One", isSpace: false },
			{ text: "", isSpace: true },
			{ text: "Two", isSpace: false },
		]);
	});

	test("no lines is no units", () => {
		expect(splitLines([])).toEqual([]);
	});
});

describe("resolveScrollTextLayout", () => {
	test("word split: one group per word, spaces dropped, indices counted over words", () => {
		const layout = resolveScrollTextLayout(splitText("Hi there you", "word"), "word");
		expect(layout.count).toBe(3);
		expect(layout.groups.map((group) => group.kind)).toEqual(["word", "word", "word"]);
		expect(
			layout.groups.flatMap((group) => (group.kind === "word" ? group.units.map((unit) => unit.index) : []))
		).toEqual([0, 1, 2]);
	});

	test("character split: a word groups its graphemes, indices run across words", () => {
		const layout = resolveScrollTextLayout(splitText("ab cd", "character"), "character");
		expect(layout.count).toBe(4);
		expect(layout.groups).toEqual([
			{
				kind: "word",
				units: [
					{ text: "a", index: 0 },
					{ text: "b", index: 1 },
				],
			},
			{
				kind: "word",
				units: [
					{ text: "c", index: 2 },
					{ text: "d", index: 3 },
				],
			},
		]);
	});

	test("a newline in the whitespace becomes a forced break, once per newline", () => {
		const layout = resolveScrollTextLayout(splitText("one\n\ntwo", "word"), "word");
		expect(layout.groups.map((group) => group.kind)).toEqual(["word", "break", "break", "word"]);
		expect(layout.groups.filter((group) => group.kind === "break")).toEqual([
			{ kind: "break", isBlank: false },
			{ kind: "break", isBlank: true },
		]);
		expect(layout.count).toBe(2);
	});

	test("line split: every line a group, a blank line a break", () => {
		const layout = resolveScrollTextLayout(splitLines(["One", "", "Two"]), "line");
		expect(layout.groups.map((group) => group.kind)).toEqual(["line", "break", "line"]);
		expect(layout.count).toBe(2);
	});

	test("empty text is an empty layout", () => {
		expect(resolveScrollTextLayout([], "word")).toEqual({ groups: [], count: 0 });
	});
});

describe("resolveScrollTextWindow", () => {
	test("no window is the default", () => {
		expect(resolveScrollTextWindow()).toEqual(SCROLL_TEXT_DEFAULT_WINDOW);
	});

	test("a valid window passes through", () => {
		expect(resolveScrollTextWindow({ start: 1, end: 0 })).toEqual({ start: 1, end: 0 });
	});

	test.each([
		{ start: 0.3, end: 0.3 },
		{ start: 0.2, end: 0.6 },
		{ start: Number.NaN, end: 0.2 },
	])("an invalid window %p falls back to the default", (window) => {
		expect(resolveScrollTextWindow(window)).toEqual(SCROLL_TEXT_DEFAULT_WINDOW);
	});

	test("the default starts low on the screen and ends above the middle", () => {
		expect(SCROLL_TEXT_DEFAULT_WINDOW).toEqual({ start: 0.85, end: 0.35 });
	});
});

describe("resolveScrollProgress", () => {
	const vh = 800;
	const window = SCROLL_TEXT_DEFAULT_WINDOW;

	test("is 0 with the block's top at start·vh", () => {
		expect(resolveScrollProgress(window.start * vh, vh, window)).toBe(0);
	});

	test("is 1 with the block's top at end·vh", () => {
		expect(resolveScrollProgress(window.end * vh, vh, window)).toBe(1);
	});

	test("is halfway at the midpoint", () => {
		expect(resolveScrollProgress(((window.start + window.end) / 2) * vh, vh, window)).toBeCloseTo(0.5);
	});

	test("clamps below the window and above it", () => {
		expect(resolveScrollProgress(vh * 2, vh, window)).toBe(0);
		expect(resolveScrollProgress(-vh, vh, window)).toBe(1);
	});

	test("an invalid window is read as the default", () => {
		const invalid = { start: 0.2, end: 0.8 };
		expect(resolveScrollProgress(0.6 * vh, vh, invalid)).toBe(resolveScrollProgress(0.6 * vh, vh, window));
	});

	test("no viewport is no progress rather than a division by zero", () => {
		expect(resolveScrollProgress(0, 0, window)).toBe(0);
	});
});

describe("resolveRevealProgress", () => {
	test("sequential: the first of four is done at half, the third has not begun", () => {
		expect(resolveRevealProgress(0.5, 0, 4, 0)).toBe(1);
		expect(resolveRevealProgress(0.5, 2, 4, 0)).toBe(0);
	});

	test("overlap 1 is everyone together — clamp(p) for every unit", () => {
		for (const p of [-0.5, 0, 0.3, 0.7, 1, 1.4]) {
			for (const index of [0, 1, 5, 9]) {
				expect(resolveRevealProgress(p, index, 10, 1)).toBe(Math.min(1, Math.max(0, p)));
			}
		}
	});

	test("a single unit is clamp(p) at any overlap", () => {
		for (const overlap of [0, 0.4, 1]) {
			expect(resolveRevealProgress(0.3, 0, 1, overlap)).toBeCloseTo(0.3);
			expect(resolveRevealProgress(2, 0, 1, overlap)).toBe(1);
		}
	});

	test("monotonic non-decreasing in p for every unit", () => {
		for (const overlap of [0, 0.2, SCROLL_TEXT_DEFAULT_OVERLAP, 0.9]) {
			for (const index of [0, 3, 6]) {
				let previous = -1;
				for (const p of SWEEP) {
					const value = resolveRevealProgress(p, index, 7, overlap);
					expect(value).toBeGreaterThanOrEqual(previous);
					previous = value;
				}
			}
		}
	});

	test("every unit is at 0 at p=0 and at 1 at p=1, so the slots fit inside the window", () => {
		for (const overlap of [0, 0.25, 0.5, 0.75]) {
			for (let index = 0; index < 12; index++) {
				expect(resolveRevealProgress(0, index, 12, overlap)).toBe(0);
				expect(resolveRevealProgress(1, index, 12, overlap)).toBeCloseTo(1, 10);
			}
		}
	});

	test("the last unit's start plus its span is at most 1", () => {
		const count = 9;
		const overlap = 0.3;
		const span = 1 / (1 + (count - 1) * (1 - overlap));
		const step = span * (1 - overlap);
		expect((count - 1) * step + span).toBeLessThanOrEqual(1 + 1e-12);
	});

	test("an out-of-range overlap is clamped", () => {
		expect(resolveRevealProgress(0.5, 2, 4, -3)).toBe(resolveRevealProgress(0.5, 2, 4, 0));
		expect(resolveRevealProgress(0.5, 2, 4, 7)).toBe(resolveRevealProgress(0.5, 2, 4, 1));
	});

	test("the default overlap is 0.4", () => {
		expect(SCROLL_TEXT_DEFAULT_OVERLAP).toBe(0.4);
	});
});

describe("resolveEffectFloor", () => {
	test("colour holds full opacity — the dim is the colour", () => {
		expect(resolveEffectFloor({ kind: "colour" })).toEqual({ opacity: 1, translate: 0 });
	});

	test("fade defaults to the legible floor", () => {
		expect(resolveEffectFloor({ kind: "fade" })).toEqual({ opacity: SCROLL_TEXT_MIN_OPACITY, translate: 0 });
	});

	test("rise defaults to the floor and its distance", () => {
		expect(resolveEffectFloor({ kind: "rise" })).toEqual({
			opacity: SCROLL_TEXT_MIN_OPACITY,
			translate: SCROLL_TEXT_RISE_DISTANCE,
		});
		expect(resolveEffectFloor({ kind: "rise", distance: 24, from: 0.5 })).toEqual({ opacity: 0.5, translate: 24 });
	});

	test("highlight keeps the text whole and moves nothing", () => {
		expect(resolveEffectFloor({ kind: "highlight" })).toEqual({ opacity: 1, translate: 0 });
	});

	test("a floor below the legible minimum is raised to it", () => {
		expect(resolveEffectFloor({ kind: "fade", from: 0 }).opacity).toBe(SCROLL_TEXT_MIN_OPACITY);
		expect(resolveEffectFloor({ kind: "rise", from: -1 }).opacity).toBe(SCROLL_TEXT_MIN_OPACITY);
		expect(resolveEffectFloor({ kind: "fade", from: 4 }).opacity).toBe(1);
	});

	test("the legible floor is 0.15 and the default rise 14pt", () => {
		expect(SCROLL_TEXT_MIN_OPACITY).toBe(0.15);
		expect(SCROLL_TEXT_RISE_DISTANCE).toBe(14);
	});
});

describe("resolveEffectFrame", () => {
	test("fade at 0 is its floor", () => {
		expect(resolveEffectFrame({ kind: "fade", from: 0.3 }, 0).opacity).toBe(0.3);
		expect(resolveEffectFrame({ kind: "fade" }, 0).opacity).toBe(SCROLL_TEXT_MIN_OPACITY);
	});

	test.each(SCROLL_TEXT_EFFECT_KINDS)("%s at 1 is fully revealed and in place", (kind) => {
		const frame = resolveEffectFrame(DEFAULT_EFFECTS[kind], 1);
		expect(frame.opacity).toBe(1);
		expect(frame.translate).toBe(0);
	});

	test("rise starts its distance below and arrives", () => {
		expect(resolveEffectFrame({ kind: "rise", distance: 20 }, 0).translate).toBe(20);
		expect(resolveEffectFrame({ kind: "rise", distance: 20 }, 0.5).translate).toBe(10);
	});

	test("only colour moves the colour and only highlight fills the band", () => {
		expect(resolveEffectFrame({ kind: "colour" }, 0.4)).toEqual({ opacity: 1, translate: 0, colorT: 0.4, fillT: 0 });
		expect(resolveEffectFrame({ kind: "highlight" }, 0.4)).toEqual({ opacity: 1, translate: 0, colorT: 0, fillT: 0.4 });
		expect(resolveEffectFrame({ kind: "fade" }, 0.4).colorT).toBe(0);
		expect(resolveEffectFrame({ kind: "rise" }, 0.4).fillT).toBe(0);
	});

	test("t outside 0..1 is clamped", () => {
		expect(resolveEffectFrame({ kind: "fade" }, -1)).toEqual(resolveEffectFrame({ kind: "fade" }, 0));
		expect(resolveEffectFrame({ kind: "rise" }, 3)).toEqual(resolveEffectFrame({ kind: "rise" }, 1));
	});

	test("a reduced rise translates nothing at any t", () => {
		for (const t of [0, 0.5, 1]) {
			expect(resolveEffectFrame({ kind: "rise", distance: 30 }, t, true).translate).toBe(0);
		}
	});
});

describe("resolveRiseDistance", () => {
	test("reduce motion is no distance", () => {
		expect(resolveRiseDistance({ kind: "rise", distance: 40 }, true)).toBe(0);
	});

	test("a rise is its distance, defaulted", () => {
		expect(resolveRiseDistance({ kind: "rise" }, false)).toBe(SCROLL_TEXT_RISE_DISTANCE);
		expect(resolveRiseDistance({ kind: "rise", distance: 8 }, false)).toBe(8);
	});

	test("nothing else rises", () => {
		expect(resolveRiseDistance({ kind: "fade" }, false)).toBe(0);
		expect(resolveRiseDistance({ kind: "colour" }, false)).toBe(0);
	});
});

describe("resolveScrollTextColorTokens", () => {
	test("colour defaults muted-foreground → foreground", () => {
		expect(resolveScrollTextColorTokens({ kind: "colour" })).toEqual({
			from: "muted-foreground",
			to: "foreground",
			isDefaultHighlight: false,
		});
	});

	test("colour honours both ends", () => {
		expect(resolveScrollTextColorTokens({ kind: "colour", from: "border", to: "primary" })).toEqual({
			from: "border",
			to: "primary",
			isDefaultHighlight: false,
		});
	});

	test("highlight defaults to primary, faded in from nothing, at the soft alpha", () => {
		expect(resolveScrollTextColorTokens({ kind: "highlight" })).toEqual({
			from: undefined,
			to: "primary",
			isDefaultHighlight: true,
		});
	});

	test("a named highlight colour is drawn at full strength", () => {
		expect(resolveScrollTextColorTokens({ kind: "highlight", color: "accent", from: "border" })).toEqual({
			from: "border",
			to: "accent",
			isDefaultHighlight: false,
		});
	});

	test("fade and rise colour nothing", () => {
		expect(resolveScrollTextColorTokens({ kind: "fade" }).to).toBeUndefined();
		expect(resolveScrollTextColorTokens({ kind: "rise" }).from).toBeUndefined();
	});

	test("the soft highlight is 20%", () => {
		expect(SCROLL_TEXT_HIGHLIGHT_ALPHA).toBe(0.2);
	});
});

describe("withAlpha", () => {
	test("a six-digit hex gains an alpha byte", () => {
		expect(withAlpha("#336699", 0.2)).toBe("#33669933");
	});

	test("a three-digit hex is expanded first", () => {
		expect(withAlpha("#369", 1)).toBe("#336699ff");
	});

	test("an eight-digit hex has its alpha multiplied", () => {
		expect(withAlpha("#33669980", 0.5)).toBe("#33669940");
	});

	test("rgb and rgba become rgba", () => {
		expect(withAlpha("rgb(10, 20, 30)", 0.2)).toBe("rgba(10, 20, 30, 0.2)");
		expect(withAlpha("rgba(10, 20, 30, 0.5)", 0.5)).toBe("rgba(10, 20, 30, 0.25)");
	});

	test("anything it cannot take apart passes through", () => {
		expect(withAlpha("hotpink", 0.2)).toBe("hotpink");
		expect(withAlpha(undefined, 0.2)).toBeUndefined();
	});
});

describe("scrollTextVariants", () => {
	test("the row wraps", () => {
		expect(scrollTextVariants().row()).toContain("flex-row");
		expect(scrollTextVariants().row()).toContain("flex-wrap");
	});

	test.each(TEXT_ALIGNS)("align %s justifies the row", (align) => {
		const expected = { left: "justify-start", center: "justify-center", right: "justify-end" }[align];
		expect(scrollTextVariants({ align }).row()).toContain(expected);
	});

	test("a word group never breaks mid-glyph", () => {
		expect(scrollTextVariants().word()).toContain("flex-row");
		expect(scrollTextVariants().word()).not.toContain("flex-wrap");
	});

	test("a break takes the whole row", () => {
		expect(scrollTextVariants().break()).toContain("w-full");
	});

	test("the band is rounded", () => {
		expect(scrollTextVariants().band()).toContain("rounded-sm");
	});

	test("the measurer is out of flow and invisible", () => {
		const measure = scrollTextVariants().measure();
		expect(measure).toContain("absolute");
		expect(measure).toContain("opacity-0");
	});

	test("the three splits", () => {
		expect(SCROLL_TEXT_SPLITS).toEqual(["character", "word", "line"]);
	});
});
