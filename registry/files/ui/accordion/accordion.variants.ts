import type { VariantProps } from "tailwind-variants";
import { tv } from "@registry/lib/tv";
import type { IconSize } from "@registry/ui/icon/icon.variants";

/** How the surface is painted. `ListGroup`'s set — an accordion is the same kind of thing. */
export const ACCORDION_VARIANTS = ["default", "secondary", "tertiary", "transparent"] as const;

export const ACCORDION_SIZES = ["sm", "md", "lg"] as const;

/** Whether one item may be open at a time, or any number of them. */
export const ACCORDION_SELECTION_MODES = ["single", "multiple"] as const;

export type AccordionVariant = (typeof ACCORDION_VARIANTS)[number];
export type AccordionSize = (typeof ACCORDION_SIZES)[number];
export type AccordionSelectionMode = (typeof ACCORDION_SELECTION_MODES)[number];

/**
 * The axes an accordion falls back to when nothing names one.
 *
 * Named once because two places read them — `defaultVariants` below and the root,
 * which settles them before `tv` is ever called. A test pins the pair, since a
 * drift between them is an accordion that renders at one size and reports another.
 */
export const ACCORDION_DEFAULT_VARIANT: AccordionVariant = "default";
export const ACCORDION_DEFAULT_SIZE: AccordionSize = "md";

/**
 * The step every glyph in an accordion is drawn at — the indicator, or an icon a
 * caller composes into a trigger.
 *
 * One step rather than two, so a chevron and a leading glyph on the same row are
 * the same mark. `Switch` makes the same call for the two ends of its track. The
 * `glyph` slot writes the class out, because Tailwind's scanner is static, and a
 * test pins the two together.
 */
export const ACCORDION_GLYPH_STEP: Record<AccordionSize, IconSize> = { sm: "xs", md: "sm", lg: "md" };

/** Theme token an `Icon` composed into a trigger inherits. */
export const ACCORDION_FOREGROUND_TOKEN = "foreground";

/**
 * Theme token the indicator inherits.
 *
 * Quieter than the title it sits beside, and a test pins that the two differ.
 * The chevron is chrome telling you the row opens; the title is the content. Paint
 * both `foreground` and the glyph carries the same weight as the words.
 */
export const ACCORDION_INDICATOR_TOKEN = "muted-foreground";

/**
 * The one spring an accordion runs.
 *
 * **The panel's height, the panel's opacity and the indicator's rotation all read
 * it**, off a single `progress` shared value, so they cannot drift out of step by
 * a frame. Two springs is the failure this constant exists to prevent: a stiffer
 * layout than chevron leaves the glyph visibly lagging the panel on every tap.
 *
 * **Critically damped**, which is `Switch`'s rule turned inside out. A switch damps
 * its thumb because an overshoot squashes against a capsule that clips it; a panel
 * damps its height because an overshoot draws the panel *taller* than its content
 * measured, flashing the surface behind it for a frame at the end of every expand.
 * A test pins the damping ratio at or above one, and below the point where it crawls.
 */
export const ACCORDION_SPRING = { damping: 26, mass: 0.4, stiffness: 400 } as const;

/**
 * Where the indicator points at each end of the travel, in degrees.
 *
 * A half turn, so a chevron pointing down at rest points up when the panel is
 * open. Interpolated off the same `progress` as the height rather than driven by
 * an effect of its own, so the two are in phase by construction.
 */
export const ACCORDION_INDICATOR_ROTATION = { collapsed: 0, expanded: 180 } as const;

/**
 * What {@link AccordionItemContextValue.contentHeight} holds before a panel has
 * ever reported its own layout.
 *
 * Negative rather than zero, because the two mean different things and the
 * difference is load-bearing. A panel that measured `0` is a real answer — a
 * panel whose content rendered nothing — and an item that treated it as "still
 * waiting" would never start its spring, leaving the indicator stuck pointing the
 * wrong way for an empty panel. Only a value no layout can produce can mean
 * *unmeasured*.
 *
 * The height style therefore floors it: `progress * max(contentHeight, 0)`.
 */
export const ACCORDION_UNMEASURED = -1;

/**
 * The window of the travel the panel's opacity ramps across.
 *
 * Tied to `progress` like everything else, but ahead of it: a panel whose opacity
 * tracked its height linearly would be half transparent at the midpoint of every
 * expand, which reads as content struggling to arrive rather than as a panel
 * opening. Closing the fade at {@link ACCORDION_CONTENT_FADE.end} leaves the last
 * of the travel to the height alone.
 */
export const ACCORDION_CONTENT_FADE = { start: 0.1, end: 0.6 } as const;

/**
 * Styling for every part of an accordion.
 *
 * One slotted `tv()` rather than a call per part, because the parts cannot import
 * the root without closing a cycle (AGENTS.md rule 3) yet all of them read the
 * same `size`.
 *
 * **Size is not decoration.** It drives the trigger's metrics, the title and
 * description type scale, the indicator's glyph step, the panel's padding *and*
 * the divider inset. Those six belong on one axis rather than in six places that
 * can drift apart — the divider inset tracking the trigger's own padding is
 * asserted as a pair for exactly that reason, and so is the panel's.
 *
 * **The variant paints the root and nothing else.** Only the root has a surface;
 * a trigger or a panel that also changed with it would be a second source for one
 * colour. A test pins that.
 *
 * **`overflow-hidden` on the root is load-bearing, not tidiness.** A panel
 * expanding inside it would otherwise square off the group's own rounded corners
 * — `ListGroup`'s rule, and the same one that makes a pressed trigger fade to the
 * edge of its own box.
 *
 * **`overflow-hidden` on `content` is the disclosure itself.** That slot's height
 * is an animated style running from zero to the height its contents measured, so
 * without the clip a collapsed panel would draw its content straight over the row
 * below it.
 *
 * **`contentInner` is out of flow, and the panel measures itself before the clip
 * is allowed to constrain anything.** Both halves were found the hard way on a
 * simulator. In normal flow the child is laid out against the clip's own height,
 * so a panel measured while the clip sits at `height: 0` reports its padding and
 * nothing else — sixteen points for a paragraph. Out of flow it measures its
 * content honestly, but a view that *mounts* absolutely into a parent already at
 * `height: 0` never fires `onLayout` at all: the frame is empty, no layout event
 * is emitted, and the panel waits for a measurement that arrives only when
 * something unrelated forces a relayout — minutes later, or never.
 *
 * So the clip has two phases, and `accordion-content.tsx` owns the switch: while
 * the panel has never measured it is positioned absolutely over its own item, which
 * takes it out of the item's layout entirely and keeps it invisible; once it has a
 * height it becomes the animated clip. Nothing moves on screen between the two,
 * because the travel has not started yet.
 *
 * **The disabled fade lands on `item`, never on `trigger`.** The trigger is a
 * `Pressable`, whose root `Animated.View` writes `opacity` every frame through a
 * `useAnimatedStyle` of its own — a class on that node is overwritten silently,
 * which is the failure `Switch` and `Radio` both record.
 *
 * No slot worn by a `View` carries `text-*`; a React Native `View` does not
 * cascade colour to a `Text` descendant, so the treatment lives on the `title` and
 * `description` slots. See AGENTS.md rule 1.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot parse
 * React Native's Flow-typed source. See AGENTS.md.
 */
export const accordionVariants = tv({
	slots: {
		/** The clipped, rounded surface every item sits in. */
		root: "overflow-hidden border border-transparent",
		/** Positioning only for a divider the root inserts — the line is a `Separator`. */
		divider: "",
		/** One item's column: its trigger, then its panel. Wears the disabled fade. */
		item: "",
		/** The row that opens the item. A `Pressable`, so it carries no opacity of its own. */
		trigger: "w-full flex-row items-center",
		/** The trigger's text column, taking whatever width the indicator leaves. */
		triggerContent: "min-w-0 flex-1 justify-center gap-0.5",
		/** The box the indicator turns inside. Its rotation is an animated style. */
		indicator: "items-center justify-center",
		/** Edge length any glyph in an accordion inherits. */
		glyph: "",
		/** The trigger's primary line. Carries its own colour — a `View` cannot cascade one. */
		title: "font-medium text-foreground",
		/** The trigger's secondary line, a step down in scale and on the muted token. */
		description: "text-muted-foreground",
		/** The clip. Its height is an animated style, never a class. */
		content: "w-full overflow-hidden",
		/** The measured layer, out of flow so no clip height can squash what it reports. */
		contentInner: "absolute top-0 right-0 left-0",
	},
	variants: {
		variant: {
			default: { root: "border-border bg-card" },
			secondary: { root: "bg-secondary" },
			tertiary: { root: "bg-tertiary" },
			transparent: { root: "bg-transparent" },
		},
		size: {
			sm: {
				root: "rounded-xl",
				trigger: "min-h-12 gap-2.5 px-3 py-3",
				divider: "mx-3",
				contentInner: "px-3 pb-3",
				glyph: "size-icon-xs",
				title: "text-sm",
				description: "text-xs",
			},
			md: {
				root: "rounded-2xl",
				trigger: "min-h-14 gap-3 px-4 py-3.5",
				divider: "mx-4",
				contentInner: "px-4 pb-4",
				glyph: "size-icon-sm",
				title: "text-base",
				description: "text-sm",
			},
			lg: {
				root: "rounded-2xl",
				trigger: "min-h-16 gap-3.5 px-5 py-4",
				divider: "mx-5",
				contentInner: "px-5 pb-5",
				glyph: "size-icon-md",
				title: "text-lg",
				description: "text-base",
			},
		},
		// The empty `false` branch is load-bearing typing, not a placeholder. `tv`
		// derives the prop type from the declared keys, so a map with only `true`
		// types the prop as `true` rather than `boolean`.
		isDisabled: { true: { item: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		variant: ACCORDION_DEFAULT_VARIANT,
		size: ACCORDION_DEFAULT_SIZE,
		isDisabled: false,
	},
});

export type AccordionVariantProps = VariantProps<typeof accordionVariants>;

/** An accordion where one item is open at a time, or none. */
export type AccordionSingleSelection = {
	selectionMode?: "single";
	/** Controlled. `null` is a controlled *empty*, not an absence. */
	value?: string | null;
	/** Which item starts open while uncontrolled. */
	defaultValue?: string | null;
	onValueChange?: (value: string | null) => void;
};

/** An accordion where any number of items are open at once. */
export type AccordionMultipleSelection = {
	selectionMode: "multiple";
	/** Controlled. */
	value?: string[];
	/** Which items start open while uncontrolled. */
	defaultValue?: string[];
	onValueChange?: (value: string[]) => void;
};

/**
 * The two shapes an accordion's state can take.
 *
 * A **true** discriminated union, so `selectionMode="single"` with an array
 * `defaultValue` is a type error rather than something the toggle has to defend
 * against at runtime. Intersecting a union like this with a widened
 * `defaultValue?: string | string[]` defeats it entirely — every member re-admits
 * both shapes, and the callback ends up typed as a function *returning* a union
 * rather than a union of functions.
 *
 * Lives here rather than in `accordion.types.ts` because that file imports React
 * Native's `ViewProps`, and the root's selection maths has to stay reachable from
 * `bun test`.
 */
export type AccordionSelection = AccordionSingleSelection | AccordionMultipleSelection;

/** Whether one item's value is in the expanded set. */
export function isItemExpanded(expanded: readonly string[], value: string): boolean {
	return expanded.includes(value);
}

/**
 * Normalises every shape a caller can hold into the one list the root keeps.
 *
 * The root holds a single `string[]` whichever mode is in play, because
 * `useControllableState` cannot be called conditionally and two hooks would be two
 * pieces of state for one answer. The caller's shape is converted at the boundary
 * instead — here on the way in, and by a narrow on `selectionMode` on the way out.
 *
 * It copies rather than aliasing, so a caller's array cannot be handed to React as
 * state it still holds a reference to.
 */
export function toExpandedList(value: string | readonly string[] | null | undefined): string[] {
	if (value === null || value === undefined) return [];
	return typeof value === "string" ? [value] : [...value];
}

/**
 * The whole state transition a tap on a trigger makes.
 *
 * Pure, so `bun test` reaches the entire matrix — the trade `toggleCheckedValue`
 * already makes for `Checkbox.Group`.
 *
 * **A real change is always a new array**, because React bails out of a re-render
 * on an unchanged reference and a mutation would flip the state while leaving the
 * screen alone. **A refused tap returns its own input**, by identity, so the root
 * can skip it — a rejected tap must not re-render and must not report an
 * `onValueChange` for a change that did not happen.
 *
 * **`isCollapsible` bounds the set, never a single item.** In multiple mode that
 * distinction is the whole point: an item still closes while others stay open, and
 * only the last one is refused. Reading it as "no item may ever close" makes a
 * multiple accordion add-only, which is a control that fills up and never empties.
 */
export function toggleExpandedValue({
	expanded,
	value,
	selectionMode,
	isCollapsible,
}: {
	expanded: readonly string[];
	value: string;
	selectionMode: AccordionSelectionMode;
	isCollapsible: boolean;
}): readonly string[] {
	const isExpanded = isItemExpanded(expanded, value);

	if (selectionMode === "single") {
		if (!isExpanded) return [value];
		return isCollapsible ? [] : expanded;
	}

	if (!isExpanded) return [...expanded, value];
	if (!isCollapsible && expanded.length === 1) return expanded;
	return expanded.filter((entry) => entry !== value);
}

/** What one item was given at its own call site. */
export type AccordionItemOwnAxes = { isDisabled?: boolean };

/** What the enclosing accordion publishes. */
export type AccordionRootAxes = { isDisabled?: boolean };

/** Every axis an item settles, ready to hand to {@link accordionVariants}. */
export type AccordionItemAxes = { isDisabled: boolean };

/**
 * Settles one item's axes from the two places they can come from.
 *
 * A two-rung ladder — the item's own prop first, the accordion last — so
 * `<Accordion isDisabled>` dims every row with nothing said at a call site, while
 * `isDisabled={false}` still opts one item back in. `??` throughout and never
 * `||`, so an explicit `false` is a value rather than an absence.
 *
 * The accordion reaches this one *state* axis only; it cannot acquire a paint axis
 * by accident, and a test pins that.
 *
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
 */
export function resolveAccordionItemAxes({
	own,
	root,
}: {
	own?: AccordionItemOwnAxes;
	root?: AccordionRootAxes | null;
}): AccordionItemAxes {
	return { isDisabled: own?.isDisabled ?? root?.isDisabled ?? false };
}
