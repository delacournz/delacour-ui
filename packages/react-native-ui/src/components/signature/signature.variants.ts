import type { VariantProps } from "tailwind-variants";
import { DELACOUR_DEFAULT_LABELS, type SignatureLabels } from "../../lib/labels";
import { tv } from "../../lib/tv";
import type { ButtonIconSize, ButtonLabelSize } from "../button/button.variants";
import { FIELD_ACCESSIBILITY_LABELS } from "../field/field.variants";

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

/**
 * The English every visible and spoken string falls back to — the catalog's
 * `signature` entry. A component reads its strings through `useLabels("signature")`,
 * so `DelacourProvider`'s `labels` and a part's own `labels` prop lay over these.
 */
export const SIGNATURE_LABELS: SignatureLabels = DELACOUR_DEFAULT_LABELS.signature;

/** What the pad says while empty, when the caller names nothing. */
export const SIGNATURE_PLACEHOLDER = SIGNATURE_LABELS.placeholder;

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

/**
 * Each pad size's toolbar button once a caller gives it a label, on the same
 * two steps as the icon-only square.
 */
export const SIGNATURE_TOOLBAR_LABEL_SIZE: Record<SignatureSize, ButtonLabelSize> = {
	sm: "sm",
	md: "md",
	lg: "md",
	full: "md",
};

/** What `Signature.Alternative` says when the caller writes nothing. */
export const SIGNATURE_ALTERNATIVE_LABEL = SIGNATURE_LABELS.alternative;

/** The history actions a pad and its toolbar offer, by the name the accessibility API uses. */
export type SignatureAction = "undo" | "redo" | "clear";

/** Every custom action the pad lists: the history actions, and `type` — the typed-name route. */
export type SignaturePadAction = SignatureAction | "type";

/**
 * What each action is called, on the toolbar and to a screen reader alike.
 *
 * "Clear signature" rather than "Clear", because clear is final and the label is
 * the only warning there is.
 */
export const SIGNATURE_ACTION_LABELS: Record<SignaturePadAction, string> = {
	undo: SIGNATURE_LABELS.undo,
	redo: SIGNATURE_LABELS.redo,
	clear: SIGNATURE_LABELS.clear,
	type: SIGNATURE_LABELS.type,
};

/** What a screen reader hears after the label, while the pad takes input. */
export const SIGNATURE_ACCESSIBILITY_HINT = SIGNATURE_LABELS.drawHint;

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
 * `label` is the enclosing `Field.Label`'s text when there is one, and
 * `requiredLabel` the word a `Field` appends for `isRequired` — the same one
 * every other control in a field says.
 */
export function describeSignature({
	label,
	strokeCount,
	isRequired = false,
	labels = SIGNATURE_LABELS,
	requiredLabel = FIELD_ACCESSIBILITY_LABELS.required,
}: {
	label: string | null;
	strokeCount: number;
	isRequired?: boolean;
	labels?: SignatureLabels;
	requiredLabel?: string;
}): string {
	const name = label ?? labels.name;
	const described = strokeCount === 0 ? labels.empty(name) : labels.drawn(name, strokeCount);
	return isRequired ? `${described}, ${requiredLabel}` : described;
}

/** One custom action, in the shape `accessibilityActions` takes. */
export type SignatureAccessibilityAction = { name: SignaturePadAction; label: string };

/**
 * The custom actions the pad offers a screen reader — only those that would do
 * something now, so a rotor never lists an action that is silently a no-op.
 *
 * `type` follows the history actions whenever the caller passed
 * `onRequestAlternative`, drawn or empty: drawing is a path a finger has to
 * trace, and the typed-name route is the one that needs no tracing, so it is
 * offered on the pad itself rather than only on a link a screen reader has to
 * find elsewhere in the toolbar.
 */
export function resolveSignatureAccessibilityActions({
	canUndo,
	canRedo,
	hasAlternative,
	isEmpty,
	isInteractive,
	labels = SIGNATURE_LABELS,
}: {
	canUndo: boolean;
	canRedo: boolean;
	hasAlternative: boolean;
	isEmpty: boolean;
	isInteractive: boolean;
	labels?: SignatureLabels;
}): SignatureAccessibilityAction[] {
	if (!isInteractive) return [];
	const actions: SignatureAccessibilityAction[] = [];
	if (canUndo) actions.push({ label: labels.undo, name: "undo" });
	if (canRedo) actions.push({ label: labels.redo, name: "redo" });
	if (!isEmpty) actions.push({ label: labels.clear, name: "clear" });
	if (hasAlternative) actions.push({ label: labels.type, name: "type" });
	return actions;
}

/**
 * The pad's own hint, before an enclosing `Field` puts its error and
 * description in front of it.
 *
 * An empty pad whose double tap opens the typed-name route says so first — it
 * is the one gesture a screen reader user can make without tracing anything.
 * A drawn pad's double tap does nothing, so it only says how to draw.
 */
export function resolveSignaturePadHint({
	hasAlternative,
	isEmpty,
	isInteractive,
	labels = SIGNATURE_LABELS,
}: {
	hasAlternative: boolean;
	isEmpty: boolean;
	isInteractive: boolean;
	labels?: SignatureLabels;
}): string | undefined {
	if (!isInteractive) return undefined;
	return hasAlternative && isEmpty ? `${labels.typeHint} ${labels.drawHint}` : labels.drawHint;
}

/** A pad custom action, or the `activate` Android's double tap performs. */
export type SignaturePadAccessibilityAction = SignatureAccessibilityAction | { name: "activate"; label?: undefined };

/** What the pad hands its `View` for a screen reader, and how its double tap is routed. */
export type SignaturePadAccessibility = {
	/** `button` while a double tap opens the typed-name route; `image` otherwise. Never `none`. */
	accessibilityRole: "button" | "image";
	accessibilityLabel: string;
	accessibilityActions: SignaturePadAccessibilityAction[];
	accessibilityState: { disabled: boolean };
	/** Android: `activate` is listed and routes to the typed-name request. */
	routesActivate: boolean;
	/**
	 * iOS: what `onAccessibilityTap` does — open the typed-name route, swallow the
	 * double tap, or nothing at all (`null`, no handler).
	 */
	accessibilityTap: "alternative" | "swallow" | null;
};

/**
 * The pad's whole accessibility surface, given its state and the `Field` around it.
 *
 * **Role follows what a double tap does.** An empty pad that takes input and has
 * a typed-name route is a `button`: VoiceOver's double tap (`onAccessibilityTap`)
 * and TalkBack's (`activate`, wired the way `resolvePressableActivation` wires
 * a Pressable) both open that route. Anything else is an `image` — a drawing, or a blank box to draw in — because a button whose double tap does
 * nothing is a lie. `none` is never used: it read an empty pad as plain text,
 * with nothing to say that it was a control at all.
 *
 * **On iOS a double tap never draws.** With nothing answering
 * `accessibilityActivate`, UIKit synthesises a touch at the element's centre,
 * and the pan — which starts a stroke on touch-down — would leave a dot in the
 * middle of the pad. So an interactive pad always answers it, with `swallow`
 * when there is nothing to open. Double-tap-and-hold still passes a held touch
 * through to the pan, which is how a screen reader user draws.
 *
 * **The name** is the caller's `accessibilityLabel` verbatim, else
 * {@link describeSignature} over the `Field`'s label.
 */
export function resolveSignaturePadAccessibility({
	accessibilityLabel,
	canRedo,
	canUndo,
	fieldLabel,
	hasAlternative,
	isDisabled,
	isEmpty,
	isInteractive,
	isRequired,
	labels = SIGNATURE_LABELS,
	platform,
	requiredLabel,
	strokeCount,
}: {
	accessibilityLabel?: string;
	canRedo: boolean;
	canUndo: boolean;
	fieldLabel: string | null;
	hasAlternative: boolean;
	isDisabled: boolean;
	isEmpty: boolean;
	isInteractive: boolean;
	isRequired: boolean;
	labels?: SignatureLabels;
	platform: string;
	requiredLabel?: string;
	strokeCount: number;
}): SignaturePadAccessibility {
	const opensAlternative = isInteractive && isEmpty && hasAlternative;
	const routesActivate = opensAlternative && platform === "android";
	const actions: SignaturePadAccessibilityAction[] = resolveSignatureAccessibilityActions({
		canRedo,
		canUndo,
		hasAlternative,
		isEmpty,
		isInteractive,
		labels,
	});
	if (routesActivate) actions.push({ name: "activate" });

	let accessibilityTap: SignaturePadAccessibility["accessibilityTap"] = null;
	if (platform === "ios" && isInteractive) accessibilityTap = opensAlternative ? "alternative" : "swallow";

	return {
		accessibilityActions: actions,
		accessibilityLabel:
			accessibilityLabel ?? describeSignature({ isRequired, label: fieldLabel, labels, requiredLabel, strokeCount }),
		accessibilityRole: opensAlternative ? "button" : "image",
		accessibilityState: { disabled: isDisabled },
		accessibilityTap,
		routesActivate,
	};
}

/**
 * Whether a signature should warn, in development, that it offers no way to
 * sign without drawing — a pad that takes input with no `onRequestAlternative`.
 * Read-only and disabled pads take no signature, so they need no route.
 */
export function shouldWarnMissingAlternative({
	hasAlternative,
	isInteractive,
}: {
	hasAlternative: boolean;
	isInteractive: boolean;
}): boolean {
	return isInteractive && !hasAlternative;
}

/** The development warning {@link shouldWarnMissingAlternative} gates. */
export const SIGNATURE_MISSING_ALTERNATIVE_WARNING =
	'A Signature that takes input has no onRequestAlternative. Drawing is a path a finger has to trace, and some people cannot trace it: pass onRequestAlternative to offer a typed-name route (Signature.Alternative and the pad\'s "type" action open it).';

export type SignatureVariantProps = VariantProps<typeof signatureVariants>;
