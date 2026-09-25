import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextColor } from "../text/text.variants";

/** What a required label appends. */
export const LABEL_REQUIRED_MARK = "*";

/**
 * The required mark's colour, in every state.
 *
 * Required is a warning about what the form will refuse, so it is drawn in the
 * colour of that refusal whether or not the value is wrong right now.
 */
export const LABEL_REQUIRED_MARK_COLOR: TextColor = "destructive";

/**
 * State for a form label and the required mark inside it.
 *
 * Two slots because the mark is a second `Text` nested in the label's own, not
 * because either carries a style of its own: **no slot here holds a type scale
 * or a colour.** The label renders `Text.Label` and passes a colour through
 * {@link resolveLabelColor}, so the scale lives in exactly one place — a
 * `text-sm font-medium` written here would be a second definition of
 * `Text.Label` that could drift from it. The mark inherits that scale by
 * nesting.
 *
 * Only the root fades. The mark is a run inside the root's text, so the root's
 * opacity already reaches it; fading it again would square the fade.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const labelVariants = tv({
	slots: {
		root: "",
		requiredMark: "",
	},
	variants: {
		// The empty `false` branches are load-bearing typing, not placeholders.
		// `tv` derives the prop type from the declared keys, so a map with only
		// `true` types the prop as `true` rather than `boolean`. See the note in
		// button.variants.ts.
		isInvalid: { true: {}, false: {} },
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		isInvalid: false,
		isDisabled: false,
	},
});

/**
 * The `Text` colour a label takes.
 *
 * Returning `undefined` is meaningful rather than lazy: `Text`'s `color` axis
 * emits nothing when it is not named, so the label falls through to
 * `Text.Label`'s own `text-foreground` without this module knowing which token
 * the preset chose.
 *
 * Pure, so the matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveLabelColor(isInvalid: boolean): TextColor | undefined {
	return isInvalid ? "destructive" : undefined;
}

/**
 * The plain text a label's children spell, or `undefined` when they are
 * anything but text.
 *
 * Strings and numbers are read, and an array of them is joined — that is what
 * `{name} address` compiles to. The `null`, `undefined` and booleans a
 * conditional child leaves behind are skipped. An element is not guessed at: it
 * could be an icon or a link, and inventing its words would put something in a
 * screen reader's mouth the caller never wrote.
 *
 * Typed on `unknown` rather than `ReactNode` so this module takes not even a
 * type import from React, which is what keeps it reachable from `bun test`.
 */
export function labelText(children: unknown): string | undefined {
	const parts = Array.isArray(children) ? children : [children];
	let text = "";

	for (const part of parts) {
		if (part === null || part === undefined || typeof part === "boolean") continue;
		if (typeof part === "string" || typeof part === "number") {
			text += String(part);
			continue;
		}
		return undefined;
	}

	return text === "" ? undefined : text;
}

/**
 * What a screen reader announces for a label.
 *
 * The caller's own `accessibilityLabel` always wins. Otherwise a required label
 * whose children are text is announced as `"Email, required"`: the mark is a
 * nested `Text`, and React Native reads a `Text` and its nested runs as one
 * string, so without this VoiceOver says "Email, star". An optional label, or
 * one whose children cannot be read as text, returns `undefined` and is left to
 * the platform.
 *
 * Pure, so the matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveLabelAccessibilityLabel({
	accessibilityLabel,
	children,
	isRequired,
}: {
	accessibilityLabel?: string;
	children: unknown;
	isRequired: boolean;
}): string | undefined {
	if (accessibilityLabel !== undefined) return accessibilityLabel;
	if (!isRequired) return undefined;

	const text = labelText(children);
	return text === undefined ? undefined : `${text}, required`;
}

export type LabelVariantProps = VariantProps<typeof labelVariants>;
