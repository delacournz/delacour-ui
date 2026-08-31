import { describe, expect, test } from "bun:test";
import { cn } from "../../lib/cn";
import {
	canNestText,
	isInlineTextVariant,
	resolveTextClass,
	TEXT_ALIGNS,
	TEXT_BASE_CLASS,
	TEXT_COLORS,
	TEXT_INLINE_VARIANTS,
	TEXT_MAX_FONT_SIZE_MULTIPLIER,
	TEXT_SIZES,
	TEXT_TRANSFORMS,
	TEXT_VARIANTS,
	TEXT_WEIGHTS,
	textVariants,
} from "./text.variants";

/** Tailwind's type scale, smallest first — position, so a test can say "a step down". */
const TYPE_SCALE = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"];

/** The three alignment utilities, which share the `text-` prefix with sizes and colours. */
const ALIGNMENTS = ["text-left", "text-center", "text-right"];

/** The single font-size utility in a class string, or undefined. */
function fontSize(cls: string): string | undefined {
	return cls.split(" ").find((name) => TYPE_SCALE.includes(name));
}

/** Position of a class string's font size on the type scale, or -1. */
function typeStep(cls: string): number {
	const size = fontSize(cls);
	return size ? TYPE_SCALE.indexOf(size) : -1;
}

/** The single font-weight utility in a class string, or undefined. */
function weightOf(cls: string): string | undefined {
	return cls.split(" ").find((name) => /^font-(normal|medium|semibold|bold)$/.test(name));
}

/** The single text-colour utility — a `text-*` that is neither a size nor an alignment. */
function colorOf(cls: string): string | undefined {
	return cls
		.split(" ")
		.find((name) => name.startsWith("text-") && !TYPE_SCALE.includes(name) && !ALIGNMENTS.includes(name));
}

/** Variants that carry a full spec, as opposed to the inline deltas. */
const BLOCK_VARIANTS = TEXT_VARIANTS.filter((variant) => !isInlineTextVariant(variant));

describe("textVariants", () => {
	// The defaultVariants regression guard, and the reason this whole design
	// works: an axis the caller does not name has to emit NOTHING so it falls
	// through to the class the enclosing Text published. `iconVariants` carries
	// the same test for the same reason.
	test("emits nothing without props, so an inherited class survives", () => {
		expect(textVariants() ?? "").toBe("");
	});

	test("gives every variant a distinct treatment", () => {
		const seen = new Set(TEXT_VARIANTS.map((variant) => textVariants({ variant })));
		expect(seen.size).toBe(TEXT_VARIANTS.length);
	});

	test("every block variant names a font size and a colour", () => {
		for (const variant of BLOCK_VARIANTS) {
			const cls = textVariants({ variant });
			expect(fontSize(cls)).toBeDefined();
			expect(colorOf(cls)).toBeDefined();
		}
	});

	// The point of an inline preset: it emits a delta and nothing else, so a
	// `Text.Strong` mid-paragraph comes out at the paragraph's size and colour
	// rather than snapping back to a base of its own.
	test("no inline variant names a font size or a colour", () => {
		for (const variant of TEXT_INLINE_VARIANTS) {
			const cls = textVariants({ variant });
			expect(fontSize(cls)).toBeUndefined();
			expect(typeStep(cls)).toBe(-1);
		}
	});

	test("the block variants descend in type scale in the order the registry lists them", () => {
		const steps = BLOCK_VARIANTS.map((variant) => typeStep(textVariants({ variant })));
		expect(steps).not.toContain(-1);
		expect([...steps]).toEqual([...steps].sort((a, b) => b - a));
	});

	test("gives every size a distinct step on the type scale", () => {
		const steps = TEXT_SIZES.map((size) => typeStep(textVariants({ size })));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(TEXT_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	test("no size emits a weight or a colour", () => {
		for (const size of TEXT_SIZES) {
			const cls = textVariants({ size });
			expect(weightOf(cls)).toBeUndefined();
			expect(colorOf(cls)).toBeUndefined();
		}
	});

	test("gives every colour a distinct token, and no size or weight", () => {
		const seen = new Set(TEXT_COLORS.map((color) => textVariants({ color })));
		expect(seen.size).toBe(TEXT_COLORS.length);

		for (const color of TEXT_COLORS) {
			const cls = textVariants({ color });
			expect(colorOf(cls)).toBeDefined();
			expect(fontSize(cls)).toBeUndefined();
			expect(weightOf(cls)).toBeUndefined();
		}
	});

	// A bespoke `--text-*` token would land in tailwind-merge's COLOUR group, so
	// a colour class and a size class would be judged to conflict and one would
	// silently vanish. This is the guard that every colour here is really a colour.
	test("every colour survives alongside a font size", () => {
		for (const color of TEXT_COLORS) {
			const merged = cn("text-lg", textVariants({ color }));
			expect(fontSize(merged)).toBe("text-lg");
			expect(colorOf(merged)).toBe(colorOf(textVariants({ color })));
		}
	});

	test("gives every weight a distinct utility, and no size or colour", () => {
		const seen = new Set(TEXT_WEIGHTS.map((weight) => textVariants({ weight })));
		expect(seen.size).toBe(TEXT_WEIGHTS.length);

		for (const weight of TEXT_WEIGHTS) {
			const cls = textVariants({ weight });
			expect(weightOf(cls)).toBeDefined();
			expect(fontSize(cls)).toBeUndefined();
			expect(colorOf(cls)).toBeUndefined();
		}
	});

	// React Native's `textAlign` accepts auto | left | right | center | justify
	// and nothing else, so Tailwind v4's logical `text-start` / `text-end` would
	// resolve to a value RN rejects.
	test("aligns with physical utilities, never logical ones", () => {
		for (const align of TEXT_ALIGNS) {
			const cls = textVariants({ align });
			expect(ALIGNMENTS).toContain(cls);
		}
		expect(TEXT_ALIGNS).not.toContain("start");
		expect(TEXT_ALIGNS).not.toContain("end");
	});

	test("gives every transform a distinct utility", () => {
		const seen = new Set(TEXT_TRANSFORMS.map((transform) => textVariants({ transform })));
		expect(seen.size).toBe(TEXT_TRANSFORMS.length);
	});

	// An empty string could not clear `overline`'s `uppercase`; `normal-case` can.
	test("transform none emits normal-case so it can clear an inherited uppercase", () => {
		expect(textVariants({ transform: "none" })).toBe("normal-case");
	});

	// tailwind-merge lists `leading` among `font-size`'s conflicting groups, so a
	// `text-lg` from the size axis silently deletes a `leading-*` written beside a
	// `text-*` in a variant string. Line height belongs in a
	// `--text-<name>--line-height` companion instead. This asserts none crept in.
	test("no variant writes a line height beside its font size", () => {
		for (const variant of TEXT_VARIANTS) {
			expect(textVariants({ variant })).not.toMatch(/\bleading-/);
		}
	});

	test("a variant and a colour compose without either dropping the other", () => {
		for (const variant of BLOCK_VARIANTS) {
			for (const color of TEXT_COLORS) {
				const cls = textVariants({ color, variant });
				expect(fontSize(cls)).toBe(fontSize(textVariants({ variant })));
				expect(colorOf(cls)).toBe(colorOf(textVariants({ color })));
			}
		}
	});
});

describe("TEXT_BASE_CLASS", () => {
	// `font-sans` is what makes the typeface themeable, and two presets have to
	// beat it — `Text.Code` and the three headings. All three land in
	// tailwind-merge's font-family group, so this only holds while the base
	// stays ahead of the variants in resolveTextClass's chain.
	test("gives up its family to Text.Code and to a heading", () => {
		const code = resolveTextClass({ variant: "code" });
		expect(code).toContain("font-mono");
		expect(code).not.toContain("font-sans");

		for (const variant of ["display", "title", "header"] as const) {
			const resolved = resolveTextClass({ variant });
			expect(resolved).toContain("font-heading");
			expect(resolved).not.toContain("font-sans");
		}
	});

	test("names a family, a size, a weight and a colour — a Text is never unstyled", () => {
		expect(TEXT_BASE_CLASS).toContain("font-sans");
		expect(fontSize(TEXT_BASE_CLASS)).toBeDefined();
		expect(weightOf(TEXT_BASE_CLASS)).toBeDefined();
		expect(colorOf(TEXT_BASE_CLASS)).toBe("text-foreground");
	});

	test("loses every axis it names to a class that names the same one", () => {
		const resolved = resolveTextClass({ inherited: "font-mono font-bold text-2xl text-destructive" });
		for (const name of TEXT_BASE_CLASS.split(" ")) {
			expect(resolved).not.toContain(name);
		}
	});
});

describe("isInlineTextVariant", () => {
	test("separates the deltas from the full specs", () => {
		for (const variant of TEXT_INLINE_VARIANTS) {
			expect(isInlineTextVariant(variant)).toBe(true);
		}
		expect(isInlineTextVariant("paragraph")).toBe(false);
		expect(isInlineTextVariant("display")).toBe(false);
	});

	test("every inline variant is a member of the full registry", () => {
		for (const variant of TEXT_INLINE_VARIANTS) {
			expect(TEXT_VARIANTS).toContain(variant);
		}
	});
});

describe("resolveTextClass", () => {
	test("falls back to the base treatment when there is nothing to go on", () => {
		expect(resolveTextClass({})).toBe(TEXT_BASE_CLASS);
	});

	test("an inherited class beats the base", () => {
		expect(resolveTextClass({ inherited: "text-2xl" })).toContain("text-2xl");
		expect(resolveTextClass({ inherited: "text-2xl" })).not.toContain("text-base");
	});

	test("a named variant beats an inherited class", () => {
		const paragraph = resolveTextClass({ variant: "paragraph" });
		const nested = resolveTextClass({ inherited: paragraph, variant: "display" });
		expect(fontSize(nested)).toBe("text-3xl");
	});

	test("a named colour beats an inherited colour", () => {
		const parent = resolveTextClass({ color: "destructive" });
		expect(colorOf(resolveTextClass({ color: "muted", inherited: parent }))).toBe("text-muted-foreground");
	});

	test("a className beats a named variant, a named colour and an inherited class", () => {
		expect(fontSize(resolveTextClass({ className: "text-xs", variant: "display" }))).toBe("text-xs");
		expect(colorOf(resolveTextClass({ className: "text-success", color: "destructive" }))).toBe("text-success");
		expect(fontSize(resolveTextClass({ className: "text-xs", inherited: "text-3xl" }))).toBe("text-xs");
	});

	// The headline behaviour: React Native cascades a parent Text's style to a
	// nested one natively, and this is what reproduces that through classNames.
	test("an axis the child does not name is inherited", () => {
		const parent = resolveTextClass({ color: "destructive", variant: "title" });
		const child = resolveTextClass({ color: "muted", inherited: parent });

		expect(fontSize(child)).toBe(fontSize(parent));
		expect(weightOf(child)).toBe(weightOf(parent));
		expect(colorOf(child)).toBe("text-muted-foreground");
	});

	// The Text.Strong case — it names a weight and nothing else.
	test("a named weight leaves an inherited size and colour standing", () => {
		const parent = resolveTextClass({ color: "muted", variant: "caption" });
		const child = resolveTextClass({ inherited: parent, weight: "bold" });

		expect(weightOf(child)).toBe("font-bold");
		expect(fontSize(child)).toBe(fontSize(parent));
		expect(colorOf(child)).toBe(colorOf(parent));
	});

	test("a named size beats the variant's own size", () => {
		const cls = resolveTextClass({ size: "sm", variant: "header" });
		expect(fontSize(cls)).toBe("text-sm");
		expect(weightOf(cls)).toBe(weightOf(textVariants({ variant: "header" })));
	});

	test("resolves to exactly one font size, one weight and one colour", () => {
		const cls = resolveTextClass({
			className: "text-success",
			color: "destructive",
			inherited: "font-bold text-3xl text-muted-foreground",
			size: "lg",
			variant: "caption",
			weight: "medium",
		});

		expect(cls.split(" ").filter((name) => TYPE_SCALE.includes(name))).toHaveLength(1);
		expect(cls.split(" ").filter((name) => /^font-(normal|medium|semibold|bold)$/.test(name))).toHaveLength(1);
		expect(cls.split(" ").filter((name) => name.startsWith("text-") && !TYPE_SCALE.includes(name))).toHaveLength(1);
	});

	test("transform none clears an overline's uppercase", () => {
		const cls = resolveTextClass({ transform: "none", variant: "overline" });
		expect(cls).toContain("normal-case");
		expect(cls).not.toContain("uppercase");
	});

	// A standalone Text.Code is an ordinary Yoga box and takes padding. A nested
	// one is a run inside the platform text engine, which ignores padding, margin
	// and radius outright — so applying them would be a lie, not just wasted CSS.
	test("code is padded only when it stands alone", () => {
		expect(resolveTextClass({ variant: "code" })).toContain("px-1.5");
		expect(resolveTextClass({ isNested: true, variant: "code" })).not.toContain("px-1.5");
		expect(resolveTextClass({ isNested: true, variant: "code" })).toContain("font-mono");
	});

	test("an explicitly undefined axis is the same as omitting it", () => {
		expect(resolveTextClass({ color: undefined, variant: undefined })).toBe(resolveTextClass({}));
	});

	test("an empty inherited string behaves as no inherited class", () => {
		expect(resolveTextClass({ inherited: "" })).toBe(TEXT_BASE_CLASS);
	});

	test("carries through a className that is not typographic", () => {
		const cls = resolveTextClass({ className: "mb-4" });
		expect(cls).toContain("mb-4");
		expect(fontSize(cls)).toBe("text-base");
	});
});

// The correctness proof for the whole feature. If a nested Text with no props of
// its own resolves to anything but its parent's exact class string, inheritance
// is lossy somewhere — and the loss would be invisible until someone looked at a
// screen. Asserted across the matrix, and re-resolved so depth cannot drift.
describe("the nesting fixpoint", () => {
	const CLASSNAMES = [undefined, "mb-4", "text-4xl", "italic underline"];

	test("a nested Text with no props resolves to exactly its parent's class", () => {
		for (const variant of TEXT_VARIANTS) {
			for (const color of TEXT_COLORS) {
				for (const className of CLASSNAMES) {
					let parent = resolveTextClass({ className, color, variant });

					for (let depth = 0; depth < 5; depth += 1) {
						const child = resolveTextClass({ inherited: parent, isNested: true });
						expect(child).toBe(parent);
						parent = child;
					}
				}
			}
		}
	});

	test("the published class does not grow with depth", () => {
		const root = resolveTextClass({ color: "destructive", variant: "display" });
		let current = root;
		for (let depth = 0; depth < 10; depth += 1) {
			current = resolveTextClass({ inherited: current, isNested: true });
		}
		expect(current.split(" ")).toHaveLength(root.split(" ").length);
	});
});

// Merge behaviour that is easy to mistake for a bug and "fix" into a real one.
describe("the inheritance contract with tailwind-merge", () => {
	// Without this, a Button publishing nothing but `text-primary-foreground`
	// would leave a nested Text with a colour and NO font size — silently
	// collapsing to React Native's 14pt default. This is why the base class is
	// applied unconditionally rather than guarded behind "am I nested".
	test("the base still supplies the axes a partial provider left open", () => {
		const cls = resolveTextClass({ inherited: "text-primary-foreground", isNested: true });
		expect(fontSize(cls)).toBe("text-base");
		expect(weightOf(cls)).toBe("font-normal");
		expect(colorOf(cls)).toBe("text-primary-foreground");
	});

	// tailwind-merge conflicts a font size INTO line-height but not the reverse,
	// so a size always wins and the leading vanishes. Documented, not fought.
	test("a font size drops an inherited line height", () => {
		expect(resolveTextClass({ inherited: "text-lg leading-7", size: "xs" })).not.toContain("leading-7");
	});

	// A bespoke `--text-*` token like `button-md` is registered in tokens.ts as a
	// size. Unregistered it would land in the colour group and eat text-foreground.
	test("a bespoke type token from another component merges as a size", () => {
		const cls = resolveTextClass({ inherited: "text-button-md" });
		expect(cls).toContain("text-button-md");
		expect(cls).not.toContain("text-base");
		expect(cls).toContain("text-foreground");
	});

	// `text-[17px]` and `text-(length:--x)` read as sizes; `text-[var(--x)]` is
	// ambiguous and tailwind-merge files it under colour. Callers need to know.
	test("an arbitrary size overrides the base only when written as a length", () => {
		expect(resolveTextClass({ className: "text-[17px]" })).not.toContain("text-base");
		expect(resolveTextClass({ className: "text-(length:--x)" })).not.toContain("text-base");
		expect(resolveTextClass({ className: "text-[var(--x)]" })).toContain("text-base");
	});
});

describe("canNestText", () => {
	// A string or number child has no descendant component, so nothing below can
	// read the context — publishing it would render a provider element per label
	// for the most-instantiated component in the library.
	test("a string or number child cannot hold a nested Text", () => {
		expect(canNestText("Save")).toBe(false);
		expect(canNestText(42)).toBe(false);
	});

	test("anything that can have a descendant can", () => {
		expect(canNestText(["Save ", null])).toBe(true);
		expect(canNestText(undefined)).toBe(true);
		expect(canNestText(null)).toBe(true);
	});
});

describe("TEXT_MAX_FONT_SIZE_MULTIPLIER", () => {
	// A cap below 1 would shrink text at the OS default, which is the opposite of
	// what a font-scaling cap is for.
	test("caps growth without shrinking the default", () => {
		expect(TEXT_MAX_FONT_SIZE_MULTIPLIER).toBeGreaterThan(1);
	});
});
