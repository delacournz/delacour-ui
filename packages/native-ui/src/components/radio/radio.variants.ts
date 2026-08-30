import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { TextSize } from "../text/text.variants";

/** How the ring is painted. `secondary` fills it; `primary` leaves it hollow. */
export const RADIO_VARIANTS = ["primary", "secondary"] as const;

export const RADIO_SIZES = ["sm", "md", "lg"] as const;

/** Which way a `Radio.Group` lays its radios out. */
export const RADIO_ORIENTATIONS = ["vertical", "horizontal"] as const;

export type RadioVariant = (typeof RADIO_VARIANTS)[number];
export type RadioSize = (typeof RADIO_SIZES)[number];
export type RadioOrientation = (typeof RADIO_ORIENTATIONS)[number];

/**
 * The axes a radio falls back to when neither it nor its group names one.
 *
 * Named once because two places read them — `defaultVariants` below and
 * {@link resolveRadioState}, which runs before `tv` is ever called. A test pins
 * the pair, since a drift between them is a radio that renders at one size and
 * reports another.
 */
export const RADIO_DEFAULT_SIZE: RadioSize = "md";
export const RADIO_DEFAULT_VARIANT: RadioVariant = "primary";

/**
 * The spring the dot scales in and out on.
 *
 * Deliberately near `Pressable`'s `PRESS_SPRING` but a touch looser, so the dot
 * settles just after the row it sits in has rebounded. Read on the JS thread
 * inside an effect rather than captured by a worklet, so it stays a plain object.
 */
export const RADIO_DOT_SPRING = { damping: 16, mass: 0.4, stiffness: 300 } as const;

/**
 * The `Text` size step each radio size hands its label.
 *
 * `Radio.Label` renders `Text.Label` and names this step, rather than restating
 * a type scale in the `label` slot. `Text`'s own size axis is built to beat its
 * preset, so this keeps the weight and the colour in exactly one place — the
 * preset — while still letting the label track the radio's size. A test asserts
 * every value here is a size `Text` actually has.
 */
export const RADIO_LABEL_TEXT_SIZE: Record<RadioSize, TextSize> = { sm: "sm", md: "md", lg: "lg" };

/**
 * Styling for every part of a radio, and for the group that holds one.
 *
 * One slotted `tv()` rather than a call per part, because `radio-indicator.tsx`
 * and `radio-label.tsx` cannot import the root without closing a cycle (AGENTS.md
 * rule 3) yet all three read the same `size`, `variant` and `isSelected`.
 *
 * **The root takes no `self-start` and no `w-full`, and both absences are
 * load-bearing.** A radio row *is* its own tap target, so unlike a `Badge` it
 * wants the stretch it gets inside the group's `flex-col` — `self-start` would
 * shrink the target to the width of the word "Yes". But unlike a `ListGroup.Item`
 * it cannot take `w-full` either, because a `horizontal` group would then give
 * every radio the full width of the group and blow the row apart. Vertical
 * stretch already supplies the width; horizontal wants content width.
 *
 * **The label is `shrink`, never `flex-1`.** `flex-1` sets `flex-basis: 0%`, and
 * in a content-sized `horizontal` row Yoga resolves that to zero and collapses
 * the text to nothing. `shrink` lets a long label wrap without claiming a basis.
 *
 * **The row's height is a floor, never fixed.** `Text` respects OS font scaling,
 * so `h-*` would clip a label at a large accessibility step; `min-h-*` exists for
 * the hit target, which scaling may exceed but must never undercut.
 *
 * The ring indexes the shared `--spacing-icon-*` scale rather than minting one of
 * its own — a radio's ring is a small round mark in a row beside a label, the
 * same kind of thing as a row's chevron, and it should stay level with an `Icon`
 * at the same step by construction. The dot takes plain spacing steps and its
 * fit inside the ring is pinned by a test rather than by a token, the way
 * `Field` pins its gap ladder.
 *
 * `border-2` sits in the base rather than on a variant: a border declared only
 * where it is coloured would make the ring four points smaller the moment a
 * caller switched variant.
 *
 * No slot worn by a `View` carries `text-*`, and the `label` slot carries no type
 * scale, weight or colour at all — see {@link RADIO_LABEL_TEXT_SIZE}.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const radioVariants = tv({
	slots: {
		/** The group's box. Paints no state of its own — see the note below. */
		group: "w-full",
		/** The pressable row. Deliberately neither `self-start` nor `w-full`. */
		root: "flex-row items-center",
		/** The ring. Its colour is a class, so the whole matrix stays in `bun test`. */
		indicator: "items-center justify-center rounded-full border-2",
		/** The inner dot. Its scale and opacity are an animated style, never a class. */
		dot: "rounded-full bg-primary",
		/** Handed to a `Text.Label`. Layout only. */
		label: "shrink",
	},
	variants: {
		orientation: {
			vertical: { group: "flex-col" },
			horizontal: { group: "flex-row flex-wrap items-center" },
		},
		size: {
			sm: { group: "gap-2", root: "min-h-9 gap-2", indicator: "size-icon-md", dot: "size-1.5" },
			md: { group: "gap-3", root: "min-h-11 gap-2.5", indicator: "size-icon-lg", dot: "size-2" },
			lg: { group: "gap-3.5", root: "min-h-12 gap-3", indicator: "size-icon-xl", dot: "size-2.5" },
		},
		// The empty branches are load-bearing typing, not placeholders. `tv`
		// derives the prop type from the declared keys, so a map with only `true`
		// types the prop as `true` rather than `boolean`. See button.variants.ts.
		variant: { primary: {}, secondary: {} },
		isSelected: { true: {}, false: {} },
		isInvalid: { true: {}, false: {} },
		// A trailing ring turns the row into a settings row: the content takes the
		// left, the ring the far right. Declared here rather than left to a
		// caller's `justify-between` because the root already knows where the
		// indicator landed — see {@link resolveIndicatorPlacement}.
		isIndicatorTrailing: { true: { root: "justify-between" }, false: {} },
		// The fade lands on the children, never on the `root`, and that is not a
		// style choice. `root` is worn by `Pressable`'s own `Animated.View`, whose
		// `useAnimatedStyle` writes `opacity` on every frame — at rest, 1. An
		// `opacity-50` class on that node is overwritten before it is ever drawn,
		// silently, so the row stays at full contrast while behaving as disabled.
		// The ring and the label are ordinary descendants, so their opacity
		// multiplies with the root's instead of fighting it.
		//
		// The group must not fade either, or a disabled group would compound
		// `opacity-50` with each of its rows and land at a quarter opacity.
		isDisabled: { true: { indicator: "opacity-50", label: "opacity-50" }, false: {} },
	},
	compoundVariants: [
		// Neither `variant` nor `isSelected` paints the ring alone, so all four
		// cells live here — the reason a badge's twenty-four do.
		{ variant: "primary", isSelected: false, class: { indicator: "border-input bg-transparent" } },
		{ variant: "primary", isSelected: true, class: { indicator: "border-primary bg-transparent" } },
		{ variant: "secondary", isSelected: false, class: { indicator: "border-border bg-secondary" } },
		{ variant: "secondary", isSelected: true, class: { indicator: "border-primary bg-secondary" } },
		// Invalid outranks selected, and it is a compound rather than a plain
		// variant purely for emission order: `tv` emits the variants first and the
		// compounds after, so a plain `isInvalid` branch would lose to the four
		// cells above. `Input` leans on the same mechanism for focused-and-invalid.
		{ isInvalid: true, class: { indicator: "border-destructive", dot: "bg-destructive" } },
	],
	defaultVariants: {
		orientation: "vertical",
		size: RADIO_DEFAULT_SIZE,
		variant: RADIO_DEFAULT_VARIANT,
		isSelected: false,
		isInvalid: false,
		isDisabled: false,
		isIndicatorTrailing: false,
	},
});

/**
 * Where the caller put the indicator among a radio's children.
 *
 * `none` means they wrote no indicator at all, so the root composes one in at the
 * front. `end` means they placed one last with something before it — a settings
 * row, `[label and description] [ring]` — and the row spreads to push the ring to
 * the far edge. A lone indicator with nothing beside it is `start`: there is
 * nothing to spread it away from.
 *
 * This is what makes the trailing ring work without a `flex-1` spacer wedged
 * between the two, which is the shape a caller would otherwise have to reach for.
 *
 * Takes an array of "is this child an indicator" rather than the children
 * themselves, so it stays free of React and reachable from `bun test` — the trade
 * `resolveSpinnerSwapIndex` already makes.
 */
export function resolveIndicatorPlacement(isIndicator: readonly boolean[]): "start" | "end" | "none" {
	if (!isIndicator.some(Boolean)) return "none";
	if (isIndicator.length > 1 && isIndicator[isIndicator.length - 1]) return "end";
	return "start";
}

/** What an enclosing `Radio.Group` publishes, or null for a radio standing alone. */
export type RadioGroupState = {
	/** The selected value. `null` is "nothing selected", never `undefined`. */
	selected: string | null;
	size: RadioSize;
	variant: RadioVariant;
	/** Raw rather than resolved, so `??` can see past a group that named nothing. */
	isDisabled?: boolean;
	isInvalid?: boolean;
};

/** What a radio was given at its own call site. */
export type RadioOwnState = {
	value?: string;
	isSelected?: boolean;
	isDisabled?: boolean;
	isInvalid?: boolean;
	size?: RadioSize;
	variant?: RadioVariant;
};

/** What an enclosing `Field` publishes, or null outside one. */
export type RadioFieldState = { isDisabled?: boolean; isInvalid?: boolean };

/** Every axis settled, ready to hand to {@link radioVariants} and to context. */
export type RadioState = {
	size: RadioSize;
	variant: RadioVariant;
	isSelected: boolean;
	isDisabled: boolean;
	isInvalid: boolean;
	/** Whether a `Radio.Group` is driving this radio. */
	isGrouped: boolean;
};

/**
 * Settles a radio's axes from the three places they can come from.
 *
 * **Nearest wins**, the ladder `Input` already runs: a `Radio.Group` first, the
 * radio's own props next, an enclosing `Field` last. A field with no props of its
 * own turns destructive with the `Field` around it, while `<Radio isInvalid={false} />`
 * still opts out of one.
 *
 * The two axes a group owns outright — `size` and `variant` — are published
 * resolved, so a grouped radio's own copies are ignored: a group whose options
 * were different sizes is not a design. The two *state* axes are published raw,
 * which is the one place this differs from `Input.Group`, and deliberately: a
 * group holds many radios, so disabling one option out of five has to be
 * possible. A group that names the axis still wins outright.
 *
 * Selection is the group's to decide when there is one. A radio carrying no
 * `value` inside a group can never be selected — the dev warning for that lives
 * in `radio.tsx`, where the component name is available to name in the message.
 *
 * Pure, so the whole matrix is reachable from `bun test`. `Input` runs this same
 * ladder inline in its own render, where no unit test can see it. See AGENTS.md.
 */
export function resolveRadioState({
	group,
	own,
	field,
}: {
	group?: RadioGroupState | null;
	own?: RadioOwnState;
	field?: RadioFieldState | null;
}): RadioState {
	const isGrouped = group != null;

	return {
		size: group?.size ?? own?.size ?? RADIO_DEFAULT_SIZE,
		variant: group?.variant ?? own?.variant ?? RADIO_DEFAULT_VARIANT,
		isDisabled: group?.isDisabled ?? own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: group?.isInvalid ?? own?.isInvalid ?? field?.isInvalid ?? false,
		isSelected: isGrouped ? own?.value !== undefined && group.selected === own.value : (own?.isSelected ?? false),
		isGrouped,
	};
}

/**
 * Whether a press should write a new selection at all.
 *
 * Re-picking the option already selected is not a change, and a radio group has
 * no deselect gesture — so without this a tap on the current selection would
 * re-notify the caller with a value it already holds. HTML's own radio does not
 * fire `change` there either.
 *
 * Pure, so it is reachable from `bun test`. See AGENTS.md.
 */
export function shouldEmitSelection(current: string | null, next: string): boolean {
	return current !== next;
}

export type RadioVariantProps = VariantProps<typeof radioVariants>;
