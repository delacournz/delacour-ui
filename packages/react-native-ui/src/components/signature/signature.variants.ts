import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ButtonIconSize } from "../button/button.variants";

export const SIGNATURE_SIZES = ["sm", "md", "lg", "full"] as const;
export const SIGNATURE_VARIANTS = ["primary", "secondary"] as const;

export type SignatureSize = (typeof SIGNATURE_SIZES)[number];
export type SignatureVariant = (typeof SIGNATURE_VARIANTS)[number];

/**
 * The axes a signature falls back to when nothing names one.
 *
 * Named once because two places read them — `defaultVariants` below and
 * {@link resolveSignatureAxes}, which runs before `tv` is ever called. A test pins
 * the pair.
 */
export const SIGNATURE_DEFAULT_SIZE: SignatureSize = "md";
export const SIGNATURE_DEFAULT_VARIANT: SignatureVariant = "primary";

/**
 * Each fixed size's pad height, in points.
 *
 * Written as `h-30` / `h-45` / `h-60` in the slots below — Tailwind's own
 * spacing scale, not a token of this package's. A pad is the one control with
 * these heights, and nothing has yet asked to retune them. A test holds the
 * classes to these numbers. `full` has none: it fills its parent, with `md`'s
 * height as a floor.
 */
export const SIGNATURE_PAD_HEIGHT: Record<Exclude<SignatureSize, "full">, number> = { sm: 120, md: 180, lg: 240 };

/**
 * Where the guideline sits, as a fraction of the pad's height from the top.
 *
 * Below the middle, because a signature's body sits on the line and its loops
 * rise above it — a line at the centre would leave the ink crammed into the top
 * half.
 */
export const SIGNATURE_GUIDELINE_Y = 0.72;

/** The token the ink is drawn in when the caller names none. */
export const SIGNATURE_STROKE_TOKEN = "foreground";

/** What the pad says while empty, when the caller names nothing. */
export const SIGNATURE_PLACEHOLDER = "Sign here";

/**
 * Each pad size's toolbar button, an icon-only square on Button's own scale.
 *
 * `sm` steps down; every larger pad keeps `icon-md`, because a pad taller than a
 * phone's thumb reach does not make the undo button any easier to hit by
 * growing it.
 */
export const SIGNATURE_TOOLBAR_BUTTON_SIZE: Record<SignatureSize, ButtonIconSize> = {
	sm: "icon-sm",
	md: "icon-md",
	lg: "icon-md",
	full: "icon-md",
};

/** The actions a pad offers, by the name the accessibility API uses. */
export type SignatureAction = "undo" | "redo" | "clear";

/**
 * What each action is called, on the toolbar and to a screen reader alike.
 *
 * "Clear signature" rather than "Clear", because clear is final and the label is
 * the only warning there is.
 */
export const SIGNATURE_ACTION_LABELS: Record<SignatureAction, string> = {
	undo: "Undo",
	redo: "Redo",
	clear: "Clear signature",
};

/** What a screen reader hears after the label, while the pad takes input. */
export const SIGNATURE_ACCESSIBILITY_HINT = "Double tap and hold, then drag to draw.";

/**
 * Styling for every part of a signature.
 *
 * One slotted `tv()` because the pad, the toolbar and the alternative link are
 * separate files that cannot import the root without closing a cycle (AGENTS.md
 * rule 3), yet all of them read the same `size`.
 *
 * **The pad is a card-step corner**, `rounded-lg`, because a bordered block of
 * that size in a form is a card in all but name. **Invalid outranks the
 * variant's border** on both variants — it is declared after `variant`, so the
 * merger keeps its border colour.
 *
 * **The ink is not here.** It is an SVG stroke, a paint prop no class reaches
 * without wrapping `Svg` in `withUniwind` (rule 7) — see
 * {@link SIGNATURE_STROKE_TOKEN}.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const signatureVariants = tv({
	slots: {
		/** The column holding the pad, its toolbar and anything else the caller adds. */
		root: "gap-2",
		/** The drawing surface. Its children are absolutely positioned layers. */
		pad: "relative w-full overflow-hidden rounded-lg border",
		/** The layer holding the placeholder, centred and taking no touch. */
		placeholder: "absolute inset-0 items-center justify-center px-4",
		/** The layer holding the rule and its caption, placed at the guideline's height. */
		guideline: "absolute left-4 right-4",
		/** The guideline's hairline. */
		rule: "h-px bg-border",
		/** Handed to a `Text.Caption` under the rule. Layout only. */
		guidelineLabel: "pt-1",
		/** The row of actions under the pad. */
		toolbar: "flex-row items-center justify-end gap-1",
		/** The typed-name link: pushed to the row's start when it shares the toolbar. */
		alternative: "mr-auto",
	},
	variants: {
		size: {
			sm: { pad: "h-30" },
			md: { pad: "h-45" },
			lg: { pad: "h-60" },
			full: { root: "flex-1", pad: "min-h-45 flex-1" },
		},
		variant: {
			primary: { pad: "border-input bg-muted" },
			secondary: { pad: "border-border bg-transparent" },
		},
		isInvalid: { true: { pad: "border-destructive" }, false: {} },
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		size: SIGNATURE_DEFAULT_SIZE,
		variant: SIGNATURE_DEFAULT_VARIANT,
		isInvalid: false,
		isDisabled: false,
	},
});

/** What a signature was given at its own call site. */
export type SignatureOwnAxes = {
	size?: SignatureSize;
	variant?: SignatureVariant;
	isDisabled?: boolean;
	isInvalid?: boolean;
	isReadOnly?: boolean;
};

/** What an enclosing `Field` publishes, or null outside one. */
export type SignatureFieldAxes = { isDisabled?: boolean; isInvalid?: boolean };

/** Every axis settled, ready to hand to {@link signatureVariants} and to context. */
export type SignatureAxes = Required<SignatureOwnAxes>;

/**
 * Settles a signature's axes from the two places they can come from.
 *
 * The ladder every control here runs: the signature's own props, then an
 * enclosing `Field`, with `??` throughout so an explicit `false` is a value. A
 * `Field` reaches the two state axes only — `isReadOnly` is the signature's own.
 */
export function resolveSignatureAxes({
	own,
	field,
}: {
	own?: SignatureOwnAxes;
	field?: SignatureFieldAxes | null;
}): SignatureAxes {
	return {
		size: own?.size ?? SIGNATURE_DEFAULT_SIZE,
		variant: own?.variant ?? SIGNATURE_DEFAULT_VARIANT,
		isDisabled: own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own?.isInvalid ?? field?.isInvalid ?? false,
		isReadOnly: own?.isReadOnly ?? false,
	};
}

/**
 * What a screen reader says for the pad.
 *
 * Empty, it names itself a pad so the user knows it is somewhere to draw; drawn,
 * it says so and how many strokes, because the drawing itself has no words.
 * `label` is the enclosing `Field.Label`'s text when there is one.
 */
export function describeSignature({ label, strokeCount }: { label: string | null; strokeCount: number }): string {
	const name = label ?? "Signature";
	if (strokeCount === 0) return `${name} pad, empty`;
	return `${name}, drawn, ${strokeCount} ${strokeCount === 1 ? "stroke" : "strokes"}`;
}

/** One custom action, in the shape `accessibilityActions` takes. */
export type SignatureAccessibilityAction = { name: SignatureAction; label: string };

/**
 * The custom actions the pad offers a screen reader — only those that would do
 * something now, so a rotor never lists an action that is silently a no-op.
 */
export function resolveSignatureAccessibilityActions({
	canUndo,
	canRedo,
	isEmpty,
	isInteractive,
}: {
	canUndo: boolean;
	canRedo: boolean;
	isEmpty: boolean;
	isInteractive: boolean;
}): SignatureAccessibilityAction[] {
	if (!isInteractive) return [];
	const actions: SignatureAccessibilityAction[] = [];
	if (canUndo) actions.push({ label: SIGNATURE_ACTION_LABELS.undo, name: "undo" });
	if (canRedo) actions.push({ label: SIGNATURE_ACTION_LABELS.redo, name: "redo" });
	if (!isEmpty) actions.push({ label: SIGNATURE_ACTION_LABELS.clear, name: "clear" });
	return actions;
}

export type SignatureVariantProps = VariantProps<typeof signatureVariants>;
