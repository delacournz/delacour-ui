import { describe, expect, test } from "bun:test";
import {
	buildTypingTimeline,
	formatNumber,
	formatNumberParts,
	hashText,
	resolveCaretClass,
	resolveCaretOpacity,
	resolveEffectFrame,
	resolveNextPhrase,
	resolveNumberCells,
	resolveNumberFormat,
	resolveRollDirection,
	resolveRollTarget,
	resolveRowJustify,
	resolveStaggerDelay,
	resolveStaggerDelays,
	resolveTotalDuration,
	resolveTypingRest,
	resolveUnitProgress,
	resolveWheelOffset,
	resolveWidestPhrase,
	sampleTypingTimeline,
	splitGraphemes,
	splitNumberCells,
	splitText,
	TEXT_ANIMATION_CARET_KINDS,
	TEXT_ANIMATION_ORDERS,
	TEXT_ANIMATION_SLIDE_DIRECTIONS,
	TEXT_ANIMATION_UNITS,
	textAnimationVariants,
} from "./text-animation.variants";

describe("splitGraphemes", () => {
	test("splits plain text into characters", () => {
		expect(splitGraphemes("abc")).toEqual(["a", "b", "c"]);
	});

	test("an empty string is no graphemes", () => {
		expect(splitGraphemes("")).toEqual([]);
	});

	// A ZWJ family is five code points and one glyph. Split, it would enter as a
	// man, then a woman, then a girl, which is a different picture each frame.
	test("keeps a ZWJ family together", () => {
		expect(splitGraphemes("👨‍👩‍👧 ok")).toEqual(["👨‍👩‍👧", " ", "o", "k"]);
	});

	test("keeps a decomposed accent on its letter", () => {
		expect(splitGraphemes("é")).toEqual(["é"]);
		expect(splitGraphemes("é")).toEqual(["é"]);
	});

	test("pairs regional indicators into flags", () => {
		expect(splitGraphemes("🇳🇿🇦🇺")).toEqual(["🇳🇿", "🇦🇺"]);
	});

	test("keeps a skin-tone modifier on its emoji", () => {
		expect(splitGraphemes("👍🏽")).toEqual(["👍🏽"]);
	});

	test("keeps a variation selector on its base", () => {
		expect(splitGraphemes("❤️!")).toEqual(["❤️", "!"]);
	});

	test("keeps a tag-sequence flag together", () => {
		const scotland = "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
		expect(splitGraphemes(`${scotland}a`)).toEqual([scotland, "a"]);
	});

	test("keeps CR LF together", () => {
		expect(splitGraphemes("a\r\nb")).toEqual(["a", "\r\n", "b"]);
	});
});

describe("splitText", () => {
	test("splits words and flags the space between them", () => {
		expect(splitText("a b", "word")).toEqual([
			{ text: "a", isSpace: false },
			{ text: " ", isSpace: true },
			{ text: "b", isSpace: false },
		]);
	});

	test("consecutive spaces stay one unit", () => {
		expect(splitText("Hi   there", "word")).toEqual([
			{ text: "Hi", isSpace: false },
			{ text: "   ", isSpace: true },
			{ text: "there", isSpace: false },
		]);
	});

	test("leading and trailing whitespace are units of their own", () => {
		expect(splitText(" a ", "word").map((unit) => unit.isSpace)).toEqual([true, false, true]);
	});

	test("splits characters by grapheme, with whitespace runs flagged", () => {
		expect(splitText("ab  👨‍👩‍👧", "character")).toEqual([
			{ text: "a", isSpace: false },
			{ text: "b", isSpace: false },
			{ text: "  ", isSpace: true },
			{ text: "👨‍👩‍👧", isSpace: false },
		]);
	});

	test("an empty string is no units", () => {
		expect(splitText("", "word")).toEqual([]);
		expect(splitText("", "character")).toEqual([]);
	});

	test("a newline is whitespace", () => {
		expect(splitText("a\nb", "word")[1]).toEqual({ text: "\n", isSpace: true });
	});
});

describe("resolveStaggerDelay", () => {
	test("forward is index times stagger", () => {
		expect(resolveStaggerDelay(0, 4, 40, "forward")).toBe(0);
		expect(resolveStaggerDelay(3, 4, 40, "forward")).toBe(120);
	});

	test("reverse mirrors forward", () => {
		for (let i = 0; i < 4; i++) {
			expect(resolveStaggerDelay(i, 4, 40, "reverse")).toBe(resolveStaggerDelay(3 - i, 4, 40, "forward"));
		}
	});

	test("center starts in the middle and works outward", () => {
		expect(resolveStaggerDelays(5, 40, "center")).toEqual([80, 40, 0, 40, 80]);
		expect(resolveStaggerDelays(4, 40, "center")).toEqual([40, 0, 0, 40]);
	});

	test("random is a seeded permutation of the forward delays", () => {
		const a = resolveStaggerDelays(12, 10, "random", 7);
		const b = resolveStaggerDelays(12, 10, "random", 7);
		expect(a).toEqual(b);
		expect([...a].sort((x, y) => x - y)).toEqual([...resolveStaggerDelays(12, 10, "forward")]);
		expect(a).not.toEqual([...resolveStaggerDelays(12, 10, "forward")]);
	});

	test("a different seed is a different order", () => {
		expect(resolveStaggerDelays(12, 10, "random", 1)).not.toEqual(resolveStaggerDelays(12, 10, "random", 2));
	});

	test("the single-index form agrees with the list for every order", () => {
		for (const order of TEXT_ANIMATION_ORDERS) {
			const list = resolveStaggerDelays(6, 25, order, 3);
			list.forEach((delay, i) => {
				expect(resolveStaggerDelay(i, 6, 25, order, 3)).toBe(delay);
			});
		}
	});

	test("no units is no delays", () => {
		expect(resolveStaggerDelays(0, 40, "random", 1)).toEqual([]);
	});
});

describe("hashText", () => {
	test("is stable, and differs for different text", () => {
		expect(hashText("hello")).toBe(hashText("hello"));
		expect(hashText("hello")).not.toBe(hashText("hellp"));
		expect(Number.isInteger(hashText(""))).toBe(true);
	});
});

describe("resolveUnitProgress", () => {
	test("is 0 before the unit's start and 1 after its end", () => {
		expect(resolveUnitProgress(0, 100, 40, 400)).toBe(0);
		expect(resolveUnitProgress(140, 100, 40, 400)).toBe(0);
		expect(resolveUnitProgress(540, 100, 40, 400)).toBe(1);
		expect(resolveUnitProgress(10_000, 100, 40, 400)).toBe(1);
	});

	test("eases out — past the halfway mark at half time", () => {
		const half = resolveUnitProgress(200, 0, 0, 400);
		expect(half).toBeCloseTo(0.875, 5);
	});

	test("is monotonic", () => {
		let previous = -1;
		for (let t = 0; t <= 500; t += 10) {
			const p = resolveUnitProgress(t, 0, 50, 400);
			expect(p).toBeGreaterThanOrEqual(previous);
			previous = p;
		}
	});

	test("a zero duration snaps at its start", () => {
		expect(resolveUnitProgress(39, 0, 40, 0)).toBe(0);
		expect(resolveUnitProgress(40, 0, 40, 0)).toBe(1);
	});
});

describe("resolveEffectFrame", () => {
	test("every effect rests at full opacity, no offset, full scale", () => {
		const effects = [
			{ kind: "fade" },
			{ kind: "slide", from: "up" },
			{ kind: "slide", from: "left", distance: 30 },
			{ kind: "scale" },
		] as const;
		for (const effect of effects) {
			expect(resolveEffectFrame(effect, 1)).toEqual({ opacity: 1, translateX: 0, translateY: 0, scale: 1 });
		}
	});

	test("fade starts invisible and in place", () => {
		expect(resolveEffectFrame({ kind: "fade" }, 0)).toEqual({ opacity: 0, translateX: 0, translateY: 0, scale: 1 });
	});

	// The array is the public list of `from` values, so every entry must move the unit.
	test("every slide direction starts off its rest position", () => {
		for (const from of TEXT_ANIMATION_SLIDE_DIRECTIONS) {
			const frame = resolveEffectFrame({ kind: "slide", from }, 0);
			expect(Math.abs(frame.translateX) + Math.abs(frame.translateY)).toBe(12);
		}
	});

	test("slide starts its distance away on the side it comes from", () => {
		expect(resolveEffectFrame({ kind: "slide", from: "up" }, 0).translateY).toBe(-12);
		expect(resolveEffectFrame({ kind: "slide", from: "down" }, 0).translateY).toBe(12);
		expect(resolveEffectFrame({ kind: "slide", from: "left", distance: 20 }, 0).translateX).toBe(-20);
		expect(resolveEffectFrame({ kind: "slide", from: "right", distance: 20 }, 0).translateX).toBe(20);
		expect(resolveEffectFrame({ kind: "slide", from: "down", distance: 20 }, 0.5).translateY).toBe(10);
	});

	test("scale starts at its from", () => {
		expect(resolveEffectFrame({ kind: "scale" }, 0).scale).toBe(0.8);
		expect(resolveEffectFrame({ kind: "scale", from: 0.5 }, 0.5).scale).toBe(0.75);
	});
});

describe("resolveTotalDuration", () => {
	test("is when the last unit finishes", () => {
		expect(resolveTotalDuration(4, 40, 420, 100)).toBe(100 + 120 + 420);
		const delays = resolveStaggerDelays(4, 40, "forward");
		expect(resolveUnitProgress(resolveTotalDuration(4, 40, 420, 100), 100, delays[3] ?? 0, 420)).toBe(1);
	});

	test("center finishes as its outermost units do", () => {
		expect(resolveTotalDuration(5, 40, 400, 0, "center")).toBe(80 + 400);
	});

	test("no units is only the delay", () => {
		expect(resolveTotalDuration(0, 40, 420, 100)).toBe(100);
	});
});

describe("buildTypingTimeline / sampleTypingTimeline", () => {
	const opts = { speed: 10, eraseSpeed: 20, holdMs: 500, loop: true };

	test("starts empty and typing", () => {
		const timeline = buildTypingTimeline(["hello"], opts);
		expect(sampleTypingTimeline(timeline, 0)).toEqual({ phraseIndex: 0, visibleCount: 0, phase: "typing" });
	});

	test("types at its speed — characters per second", () => {
		const timeline = buildTypingTimeline(["hello"], opts);
		expect(sampleTypingTimeline(timeline, 250).visibleCount).toBe(2);
		expect(sampleTypingTimeline(timeline, 499).visibleCount).toBe(4);
	});

	test("is full and holding at len / speed", () => {
		const timeline = buildTypingTimeline(["hello"], opts);
		expect(sampleTypingTimeline(timeline, 500)).toEqual({ phraseIndex: 0, visibleCount: 5, phase: "holding" });
	});

	test("erases, decreasing, then moves to the next phrase", () => {
		const timeline = buildTypingTimeline(["hello", "hi"], opts);
		const start = 500 + 500;
		expect(sampleTypingTimeline(timeline, start)).toEqual({ phraseIndex: 0, visibleCount: 5, phase: "erasing" });
		const mid = sampleTypingTimeline(timeline, start + 100);
		expect(mid.phase).toBe("erasing");
		expect(mid.visibleCount).toBe(3);
		expect(sampleTypingTimeline(timeline, start + 250)).toEqual({ phraseIndex: 1, visibleCount: 0, phase: "typing" });
	});

	test("loops back to the first phrase", () => {
		const timeline = buildTypingTimeline(["ab", "cd"], opts);
		// type 200, hold 500, erase 100 — per phrase.
		expect(timeline.cycleMs).toBe(1600);
		expect(sampleTypingTimeline(timeline, 1600)).toEqual({ phraseIndex: 0, visibleCount: 0, phase: "typing" });
		expect(sampleTypingTimeline(timeline, 1700).visibleCount).toBe(1);
	});

	test("without loop the last phrase holds forever", () => {
		const timeline = buildTypingTimeline(["ab", "cd"], { ...opts, loop: false });
		expect(sampleTypingTimeline(timeline, 1_000_000)).toEqual({ phraseIndex: 1, visibleCount: 2, phase: "holding" });
	});

	test("one phrase without loop types once and holds", () => {
		const timeline = buildTypingTimeline(["abc"], { ...opts, loop: false });
		expect(sampleTypingTimeline(timeline, 60_000)).toEqual({ phraseIndex: 0, visibleCount: 3, phase: "holding" });
	});

	test("eraseSpeed 0 jumps straight to the next phrase", () => {
		const timeline = buildTypingTimeline(["ab", "cd"], { ...opts, eraseSpeed: 0 });
		expect(sampleTypingTimeline(timeline, 699).phase).toBe("holding");
		expect(sampleTypingTimeline(timeline, 700)).toEqual({ phraseIndex: 1, visibleCount: 0, phase: "typing" });
	});

	test("counts graphemes, not code units", () => {
		const timeline = buildTypingTimeline(["👍🏽👍🏽"], { ...opts, loop: false });
		expect(sampleTypingTimeline(timeline, 200)).toEqual({ phraseIndex: 0, visibleCount: 2, phase: "holding" });
	});

	test("a negative elapsed is the start", () => {
		const timeline = buildTypingTimeline(["ab"], opts);
		expect(sampleTypingTimeline(timeline, -50).visibleCount).toBe(0);
	});

	test("rest is the last phrase in full", () => {
		const timeline = buildTypingTimeline(["ab", "cde"], opts);
		expect(resolveTypingRest(timeline)).toEqual({ phraseIndex: 1, visibleCount: 3, phase: "holding" });
	});
});

describe("resolveCaretOpacity", () => {
	test("is solid while typing", () => {
		for (let t = 0; t < 3000; t += 137) {
			expect(resolveCaretOpacity(t, 530, true)).toBe(1);
		}
	});

	test("toggles every blinkMs otherwise", () => {
		expect(resolveCaretOpacity(0, 500, false)).toBe(1);
		expect(resolveCaretOpacity(499, 500, false)).toBe(1);
		expect(resolveCaretOpacity(500, 500, false)).toBe(0);
		expect(resolveCaretOpacity(1000, 500, false)).toBe(1);
	});

	test("a non-positive blink is solid", () => {
		expect(resolveCaretOpacity(700, 0, false)).toBe(1);
	});
});

describe("resolveNextPhrase", () => {
	test("advances, wraps when looping, stops when not", () => {
		expect(resolveNextPhrase(0, 3, true)).toBe(1);
		expect(resolveNextPhrase(2, 3, true)).toBe(0);
		expect(resolveNextPhrase(2, 3, false)).toBeNull();
	});

	test("a single phrase has nowhere to go", () => {
		expect(resolveNextPhrase(0, 1, true)).toBeNull();
		expect(resolveNextPhrase(0, 0, true)).toBeNull();
	});
});

describe("resolveWidestPhrase", () => {
	test("picks the most graphemes, the first on a tie", () => {
		expect(resolveWidestPhrase(["fast", "reliable", "small", "accurate"])).toBe(1);
		expect(resolveWidestPhrase(["👨‍👩‍👧👨‍👩‍👧", "abc"])).toBe(1);
	});

	test("an empty list is index 0", () => {
		expect(resolveWidestPhrase([])).toBe(0);
	});
});

describe("formatNumber", () => {
	test("groups and rounds", () => {
		expect(formatNumber(1234567.891, { decimals: 2 })).toBe("1,234,567.89");
		expect(formatNumber(1234567, {})).toBe("1,234,567");
		expect(formatNumber(999, {})).toBe("999");
		expect(formatNumber(0, {})).toBe("0");
	});

	test("an empty group separator disables grouping", () => {
		expect(formatNumber(1234567, { groupSeparator: "" })).toBe("1234567");
	});

	test("takes its own separators", () => {
		expect(formatNumber(1234.5, { decimals: 1, groupSeparator: ".", decimalSeparator: "," })).toBe("1.234,5");
		expect(formatNumber(1234.5, { decimals: 2, decimalSeparator: "," })).toBe("1,234,50");
	});

	test("a negative takes a true minus sign, ahead of the prefix", () => {
		expect(formatNumber(-1234, {})).toBe("−1,234");
		expect(formatNumber(-5, { prefix: "$" })).toBe("−$5");
	});

	test("a negative that rounds to zero has no sign", () => {
		expect(formatNumber(-0.4, {})).toBe("0");
		expect(formatNumber(-0, {})).toBe("0");
	});

	test("rounds the way toFixed does", () => {
		expect(formatNumber(0.5, { decimals: 0 })).toBe((0.5).toFixed(0));
		expect(formatNumber(1.5, { decimals: 0 })).toBe("2");
		expect(formatNumber(2.5, { decimals: 0 })).toBe((2.5).toFixed(0));
		expect(formatNumber(1.005, { decimals: 2 })).toBe((1.005).toFixed(2));
	});

	test("prefix and suffix", () => {
		expect(formatNumber(42, { prefix: "$", suffix: " NZD" })).toBe("$42 NZD");
	});

	test("a value with no meaning is a dash", () => {
		expect(formatNumber(Number.NaN, {})).toBe("—");
		expect(formatNumber(Number.POSITIVE_INFINITY, {})).toBe("—");
		expect(formatNumber(Number.NEGATIVE_INFINITY, { prefix: "$" })).toBe("—");
	});

	test("negative decimals are treated as none", () => {
		expect(formatNumber(12.7, { decimals: -2 })).toBe("13");
	});

	// Hermes worklets have no `Intl`; the function must not reach for it.
	test("never touches Intl", () => {
		expect(formatNumber.toString()).not.toContain("Intl");
		expect(formatNumber.toString()).not.toContain("toLocaleString");
	});
});

describe("resolveRollTarget", () => {
	test("rolls forward through the wrap on the way up", () => {
		expect(resolveRollTarget(9, 0, "up")).toBe(10);
		expect(resolveRollTarget(19, 3, "up")).toBe(23);
	});

	test("rolls back through the wrap on the way down", () => {
		expect(resolveRollTarget(0, 9, "down")).toBe(-1);
		expect(resolveRollTarget(12, 7, "down")).toBe(7);
	});

	test("lands on the digit, modulo 10, and never travels a full turn", () => {
		for (let pos = -12; pos <= 25; pos++) {
			for (let digit = 0; digit <= 9; digit++) {
				for (const direction of ["up", "down"] as const) {
					const target = resolveRollTarget(pos, digit, direction);
					expect(((target % 10) + 10) % 10).toBe(digit);
					expect(Math.abs(target - pos)).toBeLessThan(10);
					expect(direction === "up" ? target >= pos : target <= pos).toBe(true);
				}
			}
		}
	});

	test("the same digit stays put", () => {
		expect(resolveRollTarget(14, 4, "up")).toBe(14);
		expect(resolveRollTarget(14, 4, "down")).toBe(14);
	});
});

describe("resolveRollDirection", () => {
	test("up on an increase or no change, down on a decrease", () => {
		expect(resolveRollDirection(1, 2)).toBe("up");
		expect(resolveRollDirection(2, 2)).toBe("up");
		expect(resolveRollDirection(2, 1)).toBe("down");
	});
});

describe("resolveWheelOffset", () => {
	test("wraps a cumulative position into the column", () => {
		expect(resolveWheelOffset(3)).toBe(3);
		expect(resolveWheelOffset(13)).toBe(3);
		expect(resolveWheelOffset(-1)).toBe(9);
		expect(resolveWheelOffset(-0.5)).toBe(9.5);
		expect(resolveWheelOffset(9.5)).toBe(9.5);
	});
});

describe("splitNumberCells", () => {
	test("digits become wheels, everything else static", () => {
		expect(splitNumberCells("$1,248.5")).toEqual([
			{ kind: "static", text: "$" },
			{ kind: "digit", digit: 1 },
			{ kind: "static", text: "," },
			{ kind: "digit", digit: 2 },
			{ kind: "digit", digit: 4 },
			{ kind: "digit", digit: 8 },
			{ kind: "static", text: "." },
			{ kind: "digit", digit: 5 },
		]);
	});

	test("an empty string is no cells", () => {
		expect(splitNumberCells("")).toEqual([]);
	});
});

describe("formatNumberParts", () => {
	test("splits a reading into sign, prefix, body and suffix", () => {
		expect(formatNumberParts(-1234.5, { decimals: 1, prefix: "$", suffix: " NZD" })).toEqual({
			sign: "−",
			prefix: "$",
			body: "1,234.5",
			suffix: " NZD",
		});
	});

	test("joined, the parts are formatNumber", () => {
		const format = { decimals: 2, prefix: "~", suffix: "%" };
		const parts = formatNumberParts(-42.125, format);
		expect(`${parts.sign}${parts.prefix}${parts.body}${parts.suffix}`).toBe(formatNumber(-42.125, format));
	});

	test("a value with no number keeps its affixes off the dash", () => {
		expect(formatNumberParts(Number.NaN, { prefix: "$" })).toEqual({ sign: "", prefix: "", body: "—", suffix: "" });
	});
});

describe("resolveNumberFormat", () => {
	test("a prop affix wins over the format's", () => {
		expect(resolveNumberFormat({ prefix: "$", suffix: "%", decimals: 1 }, "€", undefined)).toEqual({
			prefix: "€",
			suffix: "%",
			decimals: 1,
		});
	});

	test("no format and no affix is an empty format", () => {
		expect(resolveNumberFormat(undefined, undefined, undefined)).toEqual({});
	});
});

describe("resolveNumberCells", () => {
	// "/100" rolled as three wheels before: an affix is text, not a reading.
	test("an affix is one static cell, digits and all", () => {
		expect(resolveNumberCells(72, { prefix: "Q3 ", suffix: "/100" })).toEqual([
			{ kind: "static", text: "Q3 " },
			{ kind: "digit", digit: 7 },
			{ kind: "digit", digit: 2 },
			{ kind: "static", text: "/100" },
		]);
	});

	test("the sign sits ahead of the prefix", () => {
		expect(resolveNumberCells(-5, { prefix: "$" })).toEqual([
			{ kind: "static", text: "−" },
			{ kind: "static", text: "$" },
			{ kind: "digit", digit: 5 },
		]);
	});

	test("no affix is the body's cells alone", () => {
		expect(resolveNumberCells(1248, {})).toEqual(splitNumberCells("1,248"));
	});
});

describe("resolveCaretClass", () => {
	test("a bar is a thin column, a block a translucent fill, both on the text's own colour", () => {
		expect(resolveCaretClass("bar")).toContain("bg-foreground");
		expect(resolveCaretClass("bar")).toContain("w-0.5");
		expect(resolveCaretClass("block")).toContain("bg-foreground/40");
		expect(resolveCaretClass("bar", "destructive")).toContain("bg-destructive");
		expect(resolveCaretClass("bar", "muted")).toContain("bg-muted-foreground");
		expect(resolveCaretClass("block", "info")).toContain("bg-info/40");
	});

	test("none draws nothing", () => {
		expect(resolveCaretClass("none")).toBe("");
	});

	test("every caret kind resolves", () => {
		for (const kind of TEXT_ANIMATION_CARET_KINDS) {
			expect(typeof resolveCaretClass(kind)).toBe("string");
		}
	});
});

describe("resolveRowJustify", () => {
	test("maps the text alignment onto the wrapping row", () => {
		expect(resolveRowJustify(undefined)).toBe("justify-start");
		expect(resolveRowJustify("left")).toBe("justify-start");
		expect(resolveRowJustify("center")).toBe("justify-center");
		expect(resolveRowJustify("right")).toBe("justify-end");
	});
});

describe("textAnimationVariants", () => {
	test("the reveal row wraps, a word holds together, a line takes the width", () => {
		const slots = textAnimationVariants();
		expect(slots.row()).toContain("flex-wrap");
		expect(slots.word()).toContain("flex-row");
		expect(slots.word()).not.toContain("flex-wrap");
		expect(slots.lines()).toContain("w-full");
	});

	test("phrases measure on a stage wider than any slot, unseen", () => {
		const probe = textAnimationVariants().probe();
		expect(probe).toContain("absolute");
		expect(probe).toContain("opacity-0");
		expect(probe).toContain("items-start");
		expect(probe).toMatch(/w-\[\d+px\]/);
	});

	test("inline boxes leave their own alignment to the parent", () => {
		const slots = textAnimationVariants();
		expect(slots.number()).not.toContain("self-");
		expect(slots.slot()).not.toContain("self-");
	});

	test("the wheel window clips its column", () => {
		expect(textAnimationVariants().wheel()).toContain("overflow-hidden");
	});

	test("units are exported in the documented order", () => {
		expect([...TEXT_ANIMATION_UNITS]).toEqual(["character", "word", "line"]);
	});
});
