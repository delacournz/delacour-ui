import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { BUTTON_SIZES } from "../button/button.variants";
import {
	describeSignature,
	resolveSignatureAccessibilityActions,
	resolveSignatureAxes,
	SIGNATURE_ACTION_LABELS,
	SIGNATURE_DEFAULT_SIZE,
	SIGNATURE_DEFAULT_VARIANT,
	SIGNATURE_GUIDELINE_Y,
	SIGNATURE_PAD_HEIGHT,
	SIGNATURE_SIZES,
	SIGNATURE_STROKE_TOKEN,
	SIGNATURE_TOOLBAR_BUTTON_SIZE,
	SIGNATURE_TOOLBAR_LABEL_SIZE,
	SIGNATURE_VARIANTS,
	signatureVariants,
} from "./signature.variants";

/** Tailwind's spacing scale is quarter-rem steps, so a step is four points. */
const POINTS_PER_STEP = 4;

/** Every class each slot can emit, across every axis. */
function everyClass(): string[] {
	const classes: string[] = [];
	for (const size of SIGNATURE_SIZES) {
		for (const variant of SIGNATURE_VARIANTS) {
			for (const isInvalid of [true, false]) {
				for (const isDisabled of [true, false]) {
					const slots = signatureVariants({ isDisabled, isInvalid, size, variant });
					for (const slot of Object.values(slots)) {
						classes.push(...(slot() ?? "").split(/\s+/).filter(Boolean));
					}
				}
			}
		}
	}
	return classes;
}

/** The `h-*` step a class string sets — `h-45` yields 45. */
function heightStep(value: string): number | undefined {
	const match = value.match(/(?:^|\s)h-(\d+(?:\.\d+)?)(?:\s|$)/);
	return match ? Number(match[1]) : undefined;
}

describe("signatureVariants", () => {
	test("every colour a slot names is declared in both themes", () => {
		const tokens = new Set<string>();
		for (const name of everyClass()) {
			const match = name.match(/^(?:bg|border|text)-([a-z-]+)$/);
			if (!match?.[1]) continue;
			if (["transparent", "none"].includes(match[1])) continue;
			tokens.add(match[1]);
		}
		expect(tokens.size).toBeGreaterThan(0);
		for (const token of tokens) {
			expect([token, declarationCount(token)]).toEqual([token, 2]);
		}
		expect(declarationCount(SIGNATURE_STROKE_TOKEN)).toBe(2);
	});

	test("no slot names a raw palette colour or a dark: prefix", () => {
		for (const name of everyClass()) {
			expect(name).not.toMatch(/^dark:/);
			expect(name).not.toMatch(/-(?:slate|gray|zinc|neutral|stone|red|blue|green|black|white)(?:-\d+)?$/);
		}
	});

	test("the fixed pad heights are the documented points, and ascend", () => {
		for (const size of ["sm", "md", "lg"] as const) {
			const step = heightStep(signatureVariants({ size }).pad());
			expect(step).toBeDefined();
			expect((step ?? 0) * POINTS_PER_STEP).toBe(SIGNATURE_PAD_HEIGHT[size]);
		}
		expect(SIGNATURE_PAD_HEIGHT.sm).toBeLessThan(SIGNATURE_PAD_HEIGHT.md);
		expect(SIGNATURE_PAD_HEIGHT.md).toBeLessThan(SIGNATURE_PAD_HEIGHT.lg);
	});

	test("full fills its parent with md's height as a floor", () => {
		const slots = signatureVariants({ size: "full" });
		expect(slots.pad()).toContain("flex-1");
		expect(slots.pad()).toContain(`min-h-${SIGNATURE_PAD_HEIGHT.md / POINTS_PER_STEP}`);
		expect(slots.root()).toContain("flex-1");
		expect(heightStep(slots.pad())).toBeUndefined();
	});

	test("the pad is a card-step corner", () => {
		expect(signatureVariants({}).pad()).toContain("rounded-lg");
	});

	test("primary is filled, secondary is outlined", () => {
		expect(signatureVariants({ variant: "primary" }).pad()).toContain("bg-muted");
		expect(signatureVariants({ variant: "primary" }).pad()).toContain("border-input");
		expect(signatureVariants({ variant: "secondary" }).pad()).toContain("bg-transparent");
		expect(signatureVariants({ variant: "secondary" }).pad()).toContain("border-border");
	});

	test("invalid outranks the variant's border, on both variants", () => {
		for (const variant of SIGNATURE_VARIANTS) {
			const pad = signatureVariants({ isInvalid: true, variant }).pad();
			expect(pad).toContain("border-destructive");
			expect(pad).not.toContain("border-input");
			expect(pad).not.toContain("border-border");
		}
	});

	test("disabled fades the whole root", () => {
		expect(signatureVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(signatureVariants({ isDisabled: false }).root()).not.toContain("opacity");
	});

	test("the rule is a hairline in the border colour", () => {
		expect(signatureVariants({}).rule()).toContain("h-px");
		expect(signatureVariants({}).rule()).toContain("bg-border");
	});

	test("the toolbar sits at the end of the row", () => {
		expect(signatureVariants({}).toolbar()).toContain("flex-row");
		expect(signatureVariants({}).toolbar()).toContain("justify-end");
	});

	test("a caller's class merges onto the slot", () => {
		expect(signatureVariants({}).pad({ className: "h-80" })).toContain("h-80");
		expect(signatureVariants({}).pad({ className: "h-80" })).not.toContain("h-45");
	});
});

describe("constants", () => {
	test("the guideline sits in the lower third, not on the edge", () => {
		expect(SIGNATURE_GUIDELINE_Y).toBe(0.72);
	});

	test("every toolbar button size is one Button has, square, and grows with the pad", () => {
		for (const size of SIGNATURE_SIZES) {
			const step = SIGNATURE_TOOLBAR_BUTTON_SIZE[size];
			expect(BUTTON_SIZES).toContain(step);
			expect(step.startsWith("icon-")).toBe(true);
		}
		expect(SIGNATURE_TOOLBAR_BUTTON_SIZE.sm).toBe("icon-sm");
		expect(SIGNATURE_TOOLBAR_BUTTON_SIZE.md).toBe("icon-md");
	});

	test("a labelled toolbar button steps with its icon-only square", () => {
		for (const size of SIGNATURE_SIZES) {
			expect(SIGNATURE_TOOLBAR_BUTTON_SIZE[size]).toBe(`icon-${SIGNATURE_TOOLBAR_LABEL_SIZE[size]}`);
		}
	});

	test("the toolbar labels say what they do", () => {
		expect(SIGNATURE_ACTION_LABELS).toEqual({ undo: "Undo", redo: "Redo", clear: "Clear signature" });
	});
});

describe("resolveSignatureAxes", () => {
	test("defaults", () => {
		expect(resolveSignatureAxes({})).toEqual({
			isDisabled: false,
			isInvalid: false,
			isReadOnly: false,
			size: SIGNATURE_DEFAULT_SIZE,
			variant: SIGNATURE_DEFAULT_VARIANT,
		});
	});

	test("a Field's state cascades in", () => {
		const axes = resolveSignatureAxes({ field: { isDisabled: true, isInvalid: true } });
		expect(axes.isDisabled).toBe(true);
		expect(axes.isInvalid).toBe(true);
	});

	test("the signature's own prop wins, including an explicit false", () => {
		const axes = resolveSignatureAxes({
			field: { isDisabled: true, isInvalid: true },
			own: { isDisabled: false, isInvalid: false },
		});
		expect(axes.isDisabled).toBe(false);
		expect(axes.isInvalid).toBe(false);
	});

	test("read-only is the signature's own; a Field never sets it", () => {
		expect(resolveSignatureAxes({ field: { isDisabled: true } }).isReadOnly).toBe(false);
		expect(resolveSignatureAxes({ own: { isReadOnly: true } }).isReadOnly).toBe(true);
	});

	test("tv's defaults and the resolver's are the same pair", () => {
		const resolved = signatureVariants({
			size: SIGNATURE_DEFAULT_SIZE,
			variant: SIGNATURE_DEFAULT_VARIANT,
		}).pad();
		expect(signatureVariants({}).pad()).toBe(resolved);
	});
});

describe("describeSignature", () => {
	test("empty names the pad and says it is empty", () => {
		expect(describeSignature({ label: null, strokeCount: 0 })).toBe("Signature pad, empty");
	});

	test("a Field's label names it", () => {
		expect(describeSignature({ label: "Customer signature", strokeCount: 0 })).toBe("Customer signature pad, empty");
	});

	test("drawn says so, with a count", () => {
		expect(describeSignature({ label: null, strokeCount: 1 })).toBe("Signature, drawn, 1 stroke");
		expect(describeSignature({ label: null, strokeCount: 3 })).toBe("Signature, drawn, 3 strokes");
	});
});

describe("resolveSignatureAccessibilityActions", () => {
	test("only the actions currently possible", () => {
		expect(
			resolveSignatureAccessibilityActions({ canRedo: false, canUndo: true, isEmpty: false, isInteractive: true }).map(
				(action) => action.name
			)
		).toEqual(["undo", "clear"]);
		expect(
			resolveSignatureAccessibilityActions({ canRedo: true, canUndo: false, isEmpty: true, isInteractive: true }).map(
				(action) => action.name
			)
		).toEqual(["redo"]);
	});

	test("an empty pad with nothing undone offers none", () => {
		expect(
			resolveSignatureAccessibilityActions({ canRedo: false, canUndo: false, isEmpty: true, isInteractive: true })
		).toEqual([]);
	});

	test("a pad that takes no input offers none", () => {
		expect(
			resolveSignatureAccessibilityActions({ canRedo: true, canUndo: true, isEmpty: false, isInteractive: false })
		).toEqual([]);
	});

	test("each action carries the toolbar's label", () => {
		const actions = resolveSignatureAccessibilityActions({
			canRedo: true,
			canUndo: true,
			isEmpty: false,
			isInteractive: true,
		});
		expect(actions).toEqual([
			{ label: SIGNATURE_ACTION_LABELS.undo, name: "undo" },
			{ label: SIGNATURE_ACTION_LABELS.redo, name: "redo" },
			{ label: SIGNATURE_ACTION_LABELS.clear, name: "clear" },
		]);
	});
});
