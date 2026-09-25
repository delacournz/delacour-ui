import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INPUT_SIZES, inputVariants, resolveInputFieldClass } from "../input/input.variants";
import {
	resolveTextareaCount,
	resolveTextareaFieldClass,
	resolveTextareaHeightStyle,
	resolveTextareaRows,
	resolveTextareaRowsHeight,
	TEXTAREA_BORDER_WIDTH,
	TEXTAREA_DEFAULT_MAX_ROWS,
	TEXTAREA_DEFAULT_ROWS,
	TEXTAREA_LINE_HEIGHTS,
	TEXTAREA_PADDING_Y,
	textareaVariants,
} from "./textarea.variants";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../styles/tokens.css"), "utf-8");

/** Points behind a `--text-input-*` token in `tokens.css`. */
function inputTextPoints(size: string): number {
	const match = TOKENS_CSS.match(new RegExp(`--text-input-${size}:\\s*([\\d.]+)px;`));
	if (!match?.[1]) throw new Error(`tokens.css defines no --text-input-${size}`);
	return Number(match[1]);
}

/** Points behind the first `<prefix>-N` spacing utility in a class string, at Tailwind's 4pt step. */
function spacingPoints(cls: string, prefix: string): number | undefined {
	const match = cls.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.\\d+)?)(?:\\s|$)`));
	return match?.[1] === undefined ? undefined : Number(match[1]) * 4;
}

describe("the metrics the height is derived from", () => {
	// The height is a number, so the padding it counts has to be the padding
	// the box actually wears. That padding is `Input`'s multiline `py-*`, and
	// restating it here is only safe because this test reads it back.
	test("count the vertical padding Input's multiline box wears", () => {
		for (const size of INPUT_SIZES) {
			const cls = resolveInputFieldClass({ isMultiline: true, size });
			expect(spacingPoints(cls, "py")).toBe(TEXTAREA_PADDING_Y[size]);
		}
	});

	test("count the one-pixel border every variant draws", () => {
		expect(inputVariants().root()).toMatch(/(?:^|\s)border(?:\s|$)/);
		expect(TEXTAREA_BORDER_WIDTH).toBe(1);
	});

	test("give each size the line height its field class sets", () => {
		for (const size of INPUT_SIZES) {
			const cls = resolveTextareaFieldClass({ size });
			expect(spacingPoints(cls, "leading")).toBe(TEXTAREA_LINE_HEIGHTS[size]);
		}
	});

	// A line shorter than its type clips descenders; one under 1.2× reads as
	// a wall. The ratio is what is pinned, so the type scale can be retuned.
	test("set every line between 1.2× and 1.6× the value's type size", () => {
		for (const size of INPUT_SIZES) {
			const ratio = TEXTAREA_LINE_HEIGHTS[size] / inputTextPoints(size);
			expect(ratio).toBeGreaterThanOrEqual(1.2);
			expect(ratio).toBeLessThanOrEqual(1.6);
		}
	});

	test("step the line height with the size", () => {
		const heights = INPUT_SIZES.map((size) => TEXTAREA_LINE_HEIGHTS[size]);
		expect([...heights].sort((a, b) => a - b)).toEqual(heights);
		expect(new Set(heights).size).toBe(heights.length);
	});
});

describe("resolveTextareaFieldClass", () => {
	test("replaces Input's single-line leading rather than adding a second", () => {
		for (const size of INPUT_SIZES) {
			const cls = resolveInputFieldClass({
				className: resolveTextareaFieldClass({ size }),
				isMultiline: true,
				size,
			});
			expect(cls).not.toContain("leading-tight");
			expect(cls.match(/\bleading-/g)).toHaveLength(1);
		}
	});

	test("merges an incoming className last", () => {
		expect(resolveTextareaFieldClass({ className: "leading-9", size: "md" })).toContain("leading-9");
		expect(resolveTextareaFieldClass({ className: "leading-9", size: "md" })).not.toContain("leading-6");
	});
});

describe("resolveTextareaRows", () => {
	test("defaults to four rows and a ten-row ceiling", () => {
		expect(TEXTAREA_DEFAULT_ROWS).toBe(4);
		expect(TEXTAREA_DEFAULT_MAX_ROWS).toBe(10);
		expect(resolveTextareaRows({})).toEqual({ maxRows: 10, rows: 4 });
	});

	test("never goes below one row", () => {
		expect(resolveTextareaRows({ rows: 0 }).rows).toBe(1);
		expect(resolveTextareaRows({ rows: -3 }).rows).toBe(1);
	});

	test("rounds a fractional row count down to whole lines", () => {
		expect(resolveTextareaRows({ rows: 2.7 }).rows).toBe(2);
		expect(resolveTextareaRows({ maxRows: 5.9, rows: 2 }).maxRows).toBe(5);
	});

	// A ceiling below the floor would make the field shrink as it grew.
	test("lifts a ceiling below the floor up to it", () => {
		expect(resolveTextareaRows({ maxRows: 2, rows: 6 })).toEqual({ maxRows: 6, rows: 6 });
	});

	test("falls back on a non-finite count", () => {
		expect(resolveTextareaRows({ rows: Number.NaN })).toEqual({ maxRows: 10, rows: 4 });
		expect(resolveTextareaRows({ maxRows: Number.POSITIVE_INFINITY, rows: 3 }).maxRows).toBe(10);
	});
});

describe("resolveTextareaRowsHeight", () => {
	test("is the lines plus the padding and border either side", () => {
		for (const size of INPUT_SIZES) {
			const expected = 3 * TEXTAREA_LINE_HEIGHTS[size] + 2 * TEXTAREA_PADDING_Y[size] + 2 * TEXTAREA_BORDER_WIDTH;
			expect(resolveTextareaRowsHeight({ rows: 3, size })).toBe(expected);
		}
	});

	test("grows by exactly one line per row", () => {
		for (const size of INPUT_SIZES) {
			const step = resolveTextareaRowsHeight({ rows: 5, size }) - resolveTextareaRowsHeight({ rows: 4, size });
			expect(step).toBe(TEXTAREA_LINE_HEIGHTS[size]);
		}
	});

	// A one-row textarea should not be shorter than the single-line field it
	// sits beside in a form.
	test("is never shorter than a single-line Input at one row", () => {
		const INPUT_HEIGHTS = { lg: 52, md: 44, sm: 36 } as const;
		for (const size of INPUT_SIZES) {
			expect(resolveTextareaRowsHeight({ rows: 1, size })).toBeGreaterThanOrEqual(INPUT_HEIGHTS[size]);
		}
	});
});

describe("resolveTextareaHeightStyle", () => {
	test("fixes the height at the row count when it does not grow", () => {
		expect(resolveTextareaHeightStyle({ rows: 3, size: "md" })).toEqual({
			height: resolveTextareaRowsHeight({ rows: 3, size: "md" }),
		});
	});

	test("floors at rows and caps at maxRows when it grows", () => {
		expect(resolveTextareaHeightStyle({ autoGrow: true, maxRows: 6, rows: 2, size: "sm" })).toEqual({
			maxHeight: resolveTextareaRowsHeight({ rows: 6, size: "sm" }),
			minHeight: resolveTextareaRowsHeight({ rows: 2, size: "sm" }),
		});
	});

	test("caps a growing field at ten rows when maxRows is unset", () => {
		expect(resolveTextareaHeightStyle({ autoGrow: true, size: "md" })).toEqual({
			maxHeight: resolveTextareaRowsHeight({ rows: 10, size: "md" }),
			minHeight: resolveTextareaRowsHeight({ rows: 4, size: "md" }),
		});
	});

	test("ignores maxRows on a field that does not grow", () => {
		expect(resolveTextareaHeightStyle({ maxRows: 8, rows: 2, size: "lg" })).toEqual({
			height: resolveTextareaRowsHeight({ rows: 2, size: "lg" }),
		});
	});
});

describe("resolveTextareaCount", () => {
	test("reads as used over limit", () => {
		expect(resolveTextareaCount({ length: 12, maxLength: 280 }).label).toBe("12/280");
	});

	test("announces the count as a sentence", () => {
		expect(resolveTextareaCount({ length: 1, maxLength: 280 }).accessibilityLabel).toBe("1 of 280 characters");
	});

	test("reports the limit once it is reached, and not before", () => {
		expect(resolveTextareaCount({ length: 279, maxLength: 280 }).isAtLimit).toBe(false);
		expect(resolveTextareaCount({ length: 280, maxLength: 280 }).isAtLimit).toBe(true);
	});

	test("is muted under the limit and destructive at it", () => {
		expect(resolveTextareaCount({ length: 3, maxLength: 10 }).color).toBe("muted");
		expect(resolveTextareaCount({ length: 10, maxLength: 10 }).color).toBe("destructive");
	});

	// A controlled value set past the limit in code is still over it; the
	// native `maxLength` only stops typing.
	test("still reports a value past the limit", () => {
		expect(resolveTextareaCount({ length: 300, maxLength: 280 })).toEqual({
			accessibilityLabel: "300 of 280 characters",
			color: "destructive",
			isAtLimit: true,
			label: "300/280",
		});
	});
});

describe("the count slot", () => {
	test("sits at the trailing edge", () => {
		expect(textareaVariants().count()).toContain("self-end");
	});

	test("uses tabular figures, so the count does not jitter as it changes", () => {
		expect(textareaVariants().count()).toContain("tabular-nums");
	});

	// Colour belongs to the `Text` preset's `color` prop, not to a class that
	// would fight it in the merge.
	test("carries no text colour of its own", () => {
		expect(textareaVariants().count()).not.toMatch(/\btext-(?:muted|destructive|foreground)/);
	});
});
