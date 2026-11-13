import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextColor } from "../text/text.variants";

export const FIELD_ORIENTATIONS = ["vertical", "horizontal"] as const;

export const FIELD_LEGEND_VARIANTS = ["legend", "label"] as const;

/** The parts that render a `Text` and therefore need a colour rather than a class. */
export const FIELD_TEXT_PARTS = ["label", "description", "error"] as const;

export type FieldOrientation = (typeof FIELD_ORIENTATIONS)[number];
export type FieldLegendVariant = (typeof FIELD_LEGEND_VARIANTS)[number];
export type FieldTextPart = (typeof FIELD_TEXT_PARTS)[number];

/**
 * Layout for a form field and the structures that hold one.
 *
 * One slotted `tv()` rather than a call per part, so the spacing ladder is
 * declared in a single place. That ladder is the component: `content` groups a
 * label with its description, `root` groups a field's parts, `set` groups a
 * legend with its fields, and `group` separates one field from the next. Each
 * step is looser than the one inside it, which is what makes a field read as one
 * thing and two fields as two — the ordering is the
 * contract, not the numbers, so the spacing can be retuned freely.
 *
 * **No slot here carries a type scale or a colour.** The text parts render the
 * `Text` presets — `Text.Label`, `Text.Caption` — and pass a colour through
 * {@link resolveFieldTextColor}, so the scale lives in exactly one place. A
 * `text-sm font-medium` written here would be a second definition of
 * `Text.Label` that could drift from it, which is the reason `Input` ships no
 * label part of its own. The slots hold state and layout only.
 *
 * The `View` slots hold no `text-*` at all: a React Native `View` does not
 * cascade colour to a `Text` descendant. See AGENTS.md rule 1.
 *
 * Free of React Native imports so it stays pure and unit-testable. See AGENTS.md.
 */
export const fieldVariants = tv({
	slots: {
		root: "w-full gap-1.5",
		/** A legend, its description and the fields under them. */
		set: "w-full gap-4",
		/** Field to field — the loosest step, so two fields never read as one. */
		group: "w-full gap-5",
		/** A label and its description, as one block beside a control. */
		content: "min-w-0 flex-1 gap-0.5",
		label: "",
		description: "",
		error: "",
		legend: "",
		/** The row a separator's rules and its optional label share. */
		separator: "w-full flex-row items-center gap-3",
		/** Each rule takes the width the label does not. */
		separatorLine: "flex-1",
	},
	variants: {
		orientation: {
			vertical: { root: "flex-col" },
			// `justify-between` is what pushes the control to the far edge, and it
			// is the root's job rather than the label's. The web kit grows the label
			// instead — `*:data-[slot=field-label]:flex-auto` — which needs a child
			// selector uniwind does not have, and would stretch the label vertically
			// once it sat inside a `Field.Content` column rather than beside it.
			horizontal: { root: "flex-row items-center justify-between" },
		},
		variant: {
			legend: { legend: "font-medium" },
			label: { legend: "" },
		},
		// The empty `false` branches are load-bearing typing, not placeholders.
		// `tv` derives the prop type from the declared keys, so a map with only
		// `true` types the prop as `true` rather than `boolean`. See the note in
		// button.variants.ts.
		isInvalid: { true: {}, false: {} },
		// Only the label fades. The control dims itself, and a description
		// dimmed on top of an already dimmed control reads as two problems
		// rather than one state.
		isDisabled: { true: { label: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		orientation: "vertical",
		variant: "legend",
		isInvalid: false,
		isDisabled: false,
	},
});

/**
 * The `Text` colour a text part takes, given the field's state.
 *
 * Returning `undefined` is meaningful rather than lazy: `Text`'s `color` axis
 * emits nothing when it is not named, so the part falls through to its preset's
 * own colour — `text-foreground` for a label, `text-muted-foreground` for a
 * description. That is what lets a part say "leave it alone" without knowing
 * which token its preset chose.
 *
 * The label turns with the control it names, so the pair reads as one state. The
 * description stays muted in both, so the error is the one line that appeared.
 * The error is destructive even outside an invalid field, because an error message is
 * never the calm case.
 *
 * Pure, so the whole matrix is unit-testable. See AGENTS.md.
 */
export function resolveFieldTextColor(part: FieldTextPart, isInvalid: boolean): TextColor | undefined {
	switch (part) {
		case "label":
			return isInvalid ? "destructive" : undefined;
		case "error":
			return "destructive";
		default:
			return undefined;
	}
}

/**
 * Whether the field's row should render as a `Pressable` rather than a `View`.
 *
 * Only once a control inside has offered a press. A field is layout until then,
 * and mounting a `GestureDetector` regardless would put one under every label
 * and description in a form — the same thing `Badge` refuses to do for a list of
 * fifty tags, and for the same reason: assistive technology would announce a row
 * of static text as something you can activate.
 *
 * A type predicate rather than a plain boolean, so the branch that renders the
 * `Pressable` gets a non-null `onPress` out of the same check that decided it.
 *
 * Pure, so the decision is unit-testable. See AGENTS.md.
 */
export function resolveFieldInteractive(press: (() => void) | null): press is () => void {
	return press !== null;
}

/**
 * The text a `Field.Label` can lend to the control beside it as its accessible
 * name, or `null` when it has none to lend.
 *
 * Only a bare string or number qualifies. A label built from elements has no
 * text this side of a render, and guessing at one would name a control after
 * the wrong thing — an icon's key, say. Whitespace is trimmed and an empty
 * string is an absence, because a screen reader handed `""` reads nothing at
 * all, which is worse than reading the value alone.
 *
 * React Native has no `<label for>`; this is the association, done by hand
 * through the field's context. Pure, so it is unit-testable. See AGENTS.md.
 */
export function resolveFieldLabelText(children: unknown): string | null {
	if (typeof children === "number") return String(children);
	if (typeof children !== "string") return null;
	const text = children.trim();
	return text === "" ? null : text;
}

/** The words a field adds to a control's announcement. English by default; pass your own to localise. */
export type FieldAccessibilityLabels = {
	/** Appended to the control's name — "Email, required". Matches `Label`'s announcement. */
	required: string;
	/** Leads the hint of an invalid control — "Invalid: Enter a valid email". */
	invalid: string;
};

export const FIELD_ACCESSIBILITY_LABELS: FieldAccessibilityLabels = { invalid: "Invalid", required: "required" };

/** The slice of a field's context a control's accessibility is built from. */
export type FieldAccessibilitySource = {
	label: string | null;
	labelNativeID: string;
	isInvalid: boolean;
	isRequired: boolean;
	error: string | null;
	description: string | null;
};

/** What a control spreads, plus the validity it should render with. */
export type FieldControlAccessibility = {
	accessibilityLabel: string | undefined;
	accessibilityHint: string | undefined;
	/** Android only — set when the field's label is an element with no text to lend. */
	accessibilityLabelledBy: string | undefined;
	isInvalid: boolean;
	isRequired: boolean;
};

/**
 * A control's accessible name, hint and validity, given the field around it.
 *
 * React Native 0.88 has no `aria-invalid`, `aria-required`,
 * `aria-describedby` or `accessibilityErrorMessage` — `accessibilityState`
 * holds none of the three either. So validity is spoken, the one channel both
 * screen readers have:
 *
 * - **Required** joins the **name**, "Email, required" — exactly what `Label`
 *   announces for its own `isRequired`, so the two say the same words.
 * - **Invalid, the error and the description** become the **hint**, in that
 *   order: "Invalid: Enter a valid email. We never share it." VoiceOver reads a
 *   hint after a pause; TalkBack reads it as the node's tooltip text. The error
 *   leads because it is the one line that changed. A control's own hint is
 *   kept, last.
 * - **An element label** has no text to lend. On Android the control points at
 *   it with `accessibilityLabelledBy` and the label's `nativeID` instead; iOS
 *   has no equivalent, so a caller there passes `accessibilityLabel`.
 *
 * Name precedence: an explicit `accessibilityLabel` verbatim (the caller
 * already said what they meant, required or not), then the control's own
 * `defaultLabel` — a `Checkbox`'s inline text — then the field's label, then
 * the control's `fallbackLabel` — `TimePicker`'s "Time". The control's own
 * `isInvalid` / `isRequired` beat the field's, the same ladder `Input` uses.
 *
 * Pure, so every branch is unit-testable. See AGENTS.md.
 */
export function resolveFieldControlAccessibility({
	accessibilityHint,
	accessibilityLabel,
	defaultLabel,
	fallbackLabel,
	field,
	isInvalid,
	isRequired,
	labels = FIELD_ACCESSIBILITY_LABELS,
	platform,
}: {
	accessibilityHint?: string;
	accessibilityLabel?: string;
	defaultLabel?: string;
	fallbackLabel?: string;
	field: FieldAccessibilitySource | null;
	isInvalid?: boolean;
	isRequired?: boolean;
	labels?: FieldAccessibilityLabels;
	platform: string;
}): FieldControlAccessibility {
	const resolvedInvalid = isInvalid ?? field?.isInvalid ?? false;
	const resolvedRequired = isRequired ?? field?.isRequired ?? false;

	const name = defaultLabel ?? field?.label ?? fallbackLabel;
	const label =
		accessibilityLabel ??
		(name !== undefined && resolvedRequired ? `${name}, ${labels.required}` : (name ?? undefined));

	const error = field?.error ?? null;
	const lead = resolvedInvalid ? (error === null ? labels.invalid : `${labels.invalid}: ${error}`) : error;
	const hint = joinSentences([lead, field?.description ?? null, accessibilityHint ?? null]);

	const labelledBy = platform === "android" && label === undefined && field !== null ? field.labelNativeID : undefined;

	return {
		accessibilityHint: hint,
		accessibilityLabel: label,
		accessibilityLabelledBy: labelledBy,
		isInvalid: resolvedInvalid,
		isRequired: resolvedRequired,
	};
}

/** Joins hint parts into sentences, adding a full stop only where a part has no closing punctuation. */
function joinSentences(parts: ReadonlyArray<string | null>): string | undefined {
	const present = parts
		.filter((part): part is string => part !== null && part.trim() !== "")
		.map((part) => part.trim());
	if (present.length === 0) return undefined;
	return present
		.map((part, index) => (index < present.length - 1 && !/[.!?…:]$/.test(part) ? `${part}.` : part))
		.join(" ");
}

/**
 * Whether `Field.Label` steps out of the accessibility tree.
 *
 * Once a control has read the label's text as its own name, a swipe that also
 * stopped on the label would say "Email" twice — once as text, once as the
 * control. So the label hides, but only when both hold: a control claimed it,
 * and there was text to claim. An element label lends nothing, so it stays the
 * thing a screen reader reads (and what Android's `accessibilityLabelledBy`
 * points at). Pure, so it is unit-testable.
 */
export function resolveFieldLabelHidden({
	isClaimed,
	labelText,
}: {
	isClaimed: boolean;
	labelText: string | null;
}): boolean {
	return isClaimed && labelText !== null;
}

export type FieldVariantProps = VariantProps<typeof fieldVariants>;
