import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { BUTTON_SIZES } from "../button/button.variants";
import {
	describeSignature,
	resolveSignatureAccessibilityActions,
	resolveSignatureAxes,
	resolveSignaturePadAccessibility,
	resolveSignaturePadHint,
	SIGNATURE_ACTION_LABELS,
	SIGNATURE_ALTERNATIVE_LABEL,
	SIGNATURE_DEFAULT_SIZE,
	SIGNATURE_DEFAULT_VARIANT,
	SIGNATURE_GUIDELINE_Y,
	SIGNATURE_LABELS,
	SIGNATURE_PAD_HEIGHT,
	SIGNATURE_PLACEHOLDER,
	SIGNATURE_SIZES,
	SIGNATURE_STROKE_TOKEN,
	SIGNATURE_TOOLBAR_BUTTON_SIZE,
	SIGNATURE_TOOLBAR_LABEL_SIZE,
	SIGNATURE_VARIANTS,
	shouldWarnMissingAlternative,
	signatureVariants,
} from "./signature.variants";

/** Tailwind's spacing scale is quarter-rem steps, so a step is four points. */
const POINTS_PER_STEP = 4;

/** Every class each slot can emit, across every axis. */
function everyClass(): string[] {
	const flags = [true, false];
	const combos = SIGNATURE_SIZES.flatMap((size) =>
		SIGNATURE_VARIANTS.flatMap((variant) =>
			flags.flatMap((isInvalid) => flags.map((isDisabled) => ({ isDisabled, isInvalid, size, variant })))
		)
	);
	return combos.flatMap((axes) =>
		Object.values(signatureVariants(axes)).flatMap((slot) => (slot() ?? "").split(/\s+/).filter(Boolean))
	);
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
		expect(SIGNATURE_ACTION_LABELS).toEqual({
			undo: "Undo",
			redo: "Redo",
			clear: "Clear signature",
			type: "Type your name instead",
		});
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

	test("required ends the name, empty or drawn", () => {
		expect(describeSignature({ isRequired: true, label: "Witness", strokeCount: 0 })).toBe(
			"Witness pad, empty, required"
		);
		expect(describeSignature({ isRequired: true, label: null, strokeCount: 2 })).toBe(
			"Signature, drawn, 2 strokes, required"
		);
	});

	test("speaks the labels it is given", () => {
		const labels = {
			...SIGNATURE_LABELS,
			drawn: (name: string, strokes: number) => `${name}: ${strokes} Striche`,
			empty: (name: string) => `${name} leer`,
			name: "Unterschrift",
		};
		expect(describeSignature({ label: null, labels, strokeCount: 0 })).toBe("Unterschrift leer");
		expect(describeSignature({ isRequired: true, label: null, labels, requiredLabel: "Pflicht", strokeCount: 2 })).toBe(
			"Unterschrift: 2 Striche, Pflicht"
		);
	});
});

describe("resolveSignatureAccessibilityActions", () => {
	const base = { canRedo: false, canUndo: false, hasAlternative: false, isEmpty: true, isInteractive: true };
	const names = (actions: ReadonlyArray<{ name: string }>) => actions.map((action) => action.name);

	test("only the actions currently possible", () => {
		expect(names(resolveSignatureAccessibilityActions({ ...base, canUndo: true, isEmpty: false }))).toEqual([
			"undo",
			"clear",
		]);
		expect(names(resolveSignatureAccessibilityActions({ ...base, canRedo: true }))).toEqual(["redo"]);
	});

	test("an empty pad with nothing undone and no typed route offers none", () => {
		expect(resolveSignatureAccessibilityActions(base)).toEqual([]);
	});

	test("a typed route is offered as a type action, empty or drawn", () => {
		expect(names(resolveSignatureAccessibilityActions({ ...base, hasAlternative: true }))).toEqual(["type"]);
		expect(
			names(resolveSignatureAccessibilityActions({ ...base, canUndo: true, hasAlternative: true, isEmpty: false }))
		).toEqual(["undo", "clear", "type"]);
	});

	test("a pad that takes no input offers none, typed route included", () => {
		expect(
			resolveSignatureAccessibilityActions({
				canRedo: true,
				canUndo: true,
				hasAlternative: true,
				isEmpty: false,
				isInteractive: false,
			})
		).toEqual([]);
	});

	test("each action carries its label", () => {
		const actions = resolveSignatureAccessibilityActions({
			canRedo: true,
			canUndo: true,
			hasAlternative: true,
			isEmpty: false,
			isInteractive: true,
		});
		expect(actions).toEqual([
			{ label: SIGNATURE_LABELS.undo, name: "undo" },
			{ label: SIGNATURE_LABELS.redo, name: "redo" },
			{ label: SIGNATURE_LABELS.clear, name: "clear" },
			{ label: SIGNATURE_LABELS.type, name: "type" },
		]);
	});

	test("labels are localisable", () => {
		const actions = resolveSignatureAccessibilityActions({
			...base,
			hasAlternative: true,
			labels: { ...SIGNATURE_LABELS, type: "Namen tippen" },
		});
		expect(actions).toEqual([{ label: "Namen tippen", name: "type" }]);
	});
});

describe("resolveSignaturePadHint", () => {
	const base = { hasAlternative: false, isEmpty: true, isInteractive: true };

	test("an interactive pad says how to draw", () => {
		expect(resolveSignaturePadHint(base)).toBe(SIGNATURE_LABELS.drawHint);
		expect(resolveSignaturePadHint({ ...base, isEmpty: false })).toBe(SIGNATURE_LABELS.drawHint);
	});

	test("an empty pad with a typed route says a double tap types instead, first", () => {
		expect(resolveSignaturePadHint({ ...base, hasAlternative: true })).toBe(
			`${SIGNATURE_LABELS.typeHint} ${SIGNATURE_LABELS.drawHint}`
		);
	});

	test("a drawn pad's double tap types nothing, so it does not say so", () => {
		expect(resolveSignaturePadHint({ ...base, hasAlternative: true, isEmpty: false })).toBe(SIGNATURE_LABELS.drawHint);
	});

	test("a pad that takes no input has no hint", () => {
		expect(resolveSignaturePadHint({ ...base, hasAlternative: true, isInteractive: false })).toBeUndefined();
	});
});

describe("resolveSignaturePadAccessibility", () => {
	const base = {
		canRedo: false,
		canUndo: false,
		fieldLabel: null,
		hasAlternative: false,
		isDisabled: false,
		isEmpty: true,
		isInteractive: true,
		isRequired: false,
		platform: "ios",
		strokeCount: 0,
	};

	test("an empty pad is never role none", () => {
		for (const hasAlternative of [false, true]) {
			for (const isInteractive of [false, true]) {
				const role = resolveSignaturePadAccessibility({ ...base, hasAlternative, isInteractive }).accessibilityRole;
				expect(role).not.toBe("none");
			}
		}
	});

	test("an empty, interactive pad with a typed route is a button whose double tap types", () => {
		const ios = resolveSignaturePadAccessibility({ ...base, hasAlternative: true });
		expect(ios.accessibilityRole).toBe("button");
		expect(ios.accessibilityTap).toBe("alternative");
		expect(ios.routesActivate).toBe(false);

		const android = resolveSignaturePadAccessibility({ ...base, hasAlternative: true, platform: "android" });
		expect(android.accessibilityRole).toBe("button");
		expect(android.routesActivate).toBe(true);
		expect(android.accessibilityActions.map((action) => action.name)).toEqual(["type", "activate"]);
		expect(android.accessibilityTap).toBeNull();
	});

	test("with nothing for a double tap to do, the pad is an image, not a button", () => {
		expect(resolveSignaturePadAccessibility(base).accessibilityRole).toBe("image");
		expect(
			resolveSignaturePadAccessibility({ ...base, hasAlternative: true, isEmpty: false, strokeCount: 2 })
				.accessibilityRole
		).toBe("image");
		expect(
			resolveSignaturePadAccessibility({ ...base, hasAlternative: true, isInteractive: false }).accessibilityRole
		).toBe("image");
	});

	test("on iOS an interactive pad swallows a stray double tap rather than drawing a dot", () => {
		expect(resolveSignaturePadAccessibility(base).accessibilityTap).toBe("swallow");
		expect(resolveSignaturePadAccessibility({ ...base, isEmpty: false, strokeCount: 1 }).accessibilityTap).toBe(
			"swallow"
		);
		expect(resolveSignaturePadAccessibility({ ...base, isInteractive: false }).accessibilityTap).toBeNull();
		expect(resolveSignaturePadAccessibility({ ...base, platform: "android" }).accessibilityTap).toBeNull();
	});

	test("named by the Field, the fallback, or the caller verbatim", () => {
		expect(resolveSignaturePadAccessibility(base).accessibilityLabel).toBe("Signature pad, empty");
		expect(
			resolveSignaturePadAccessibility({ ...base, fieldLabel: "Witness", isRequired: true }).accessibilityLabel
		).toBe("Witness pad, empty, required");
		expect(
			resolveSignaturePadAccessibility({ ...base, accessibilityLabel: "Sign the lease", fieldLabel: "Witness" })
				.accessibilityLabel
		).toBe("Sign the lease");
	});

	test("carries the disabled state and the possible actions", () => {
		const result = resolveSignaturePadAccessibility({
			...base,
			canUndo: true,
			isDisabled: true,
			isEmpty: false,
			isInteractive: false,
			strokeCount: 1,
		});
		expect(result.accessibilityState).toEqual({ disabled: true });
		expect(result.accessibilityActions).toEqual([]);
	});
});

describe("shouldWarnMissingAlternative", () => {
	test("warns only for a pad that takes input with no typed route", () => {
		expect(shouldWarnMissingAlternative({ hasAlternative: false, isInteractive: true })).toBe(true);
		expect(shouldWarnMissingAlternative({ hasAlternative: true, isInteractive: true })).toBe(false);
		expect(shouldWarnMissingAlternative({ hasAlternative: false, isInteractive: false })).toBe(false);
	});
});

describe("SIGNATURE_LABELS", () => {
	test("the exported constants are the catalog's English", () => {
		expect(SIGNATURE_PLACEHOLDER).toBe(SIGNATURE_LABELS.placeholder);
		expect(SIGNATURE_ALTERNATIVE_LABEL).toBe(SIGNATURE_LABELS.alternative);
		expect(SIGNATURE_ACTION_LABELS).toEqual({
			clear: SIGNATURE_LABELS.clear,
			redo: SIGNATURE_LABELS.redo,
			type: SIGNATURE_LABELS.type,
			undo: SIGNATURE_LABELS.undo,
		});
	});
});
