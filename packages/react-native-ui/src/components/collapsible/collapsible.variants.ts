import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { IconSize } from "../icon/icon.variants";

/**
 * How the surface is painted.
 *
 * `ListGroup`'s and `Accordion`'s set, because a collapsible is the same kind of
 * surface and the three sit beside each other on a screen. A test pins the set
 * against `Accordion`'s.
 */
export const COLLAPSIBLE_VARIANTS = ["default", "secondary", "tertiary", "transparent"] as const;

export const COLLAPSIBLE_SIZES = ["sm", "md", "lg"] as const;

export type CollapsibleVariant = (typeof COLLAPSIBLE_VARIANTS)[number];
export type CollapsibleSize = (typeof COLLAPSIBLE_SIZES)[number];

/** The axes a collapsible falls back to when nothing names one. Pinned against `defaultVariants`. */
export const COLLAPSIBLE_DEFAULT_VARIANT: CollapsibleVariant = "default";
export const COLLAPSIBLE_DEFAULT_SIZE: CollapsibleSize = "md";

/**
 * The step every glyph in a collapsible is drawn at — the indicator, or an icon a
 * caller composes into the trigger. One step, so a chevron and a leading glyph on
 * the same row are the same mark. The `glyph` slot writes the class out, because
 * Tailwind's scanner is static, and a test pins the two together.
 */
export const COLLAPSIBLE_GLYPH_STEP: Record<CollapsibleSize, IconSize> = { sm: "xs", md: "sm", lg: "md" };

/** Theme token an `Icon` composed into the trigger inherits. */
export const COLLAPSIBLE_FOREGROUND_TOKEN = "foreground";

/** Theme token the indicator inherits — a step quieter than the title, and a test pins that the two differ. */
export const COLLAPSIBLE_INDICATOR_TOKEN = "muted-foreground";

/**
 * The one spring a collapsible runs.
 *
 * **The panel's height, its opacity and the indicator's rotation all read it**,
 * off a single `progress` shared value, so they cannot drift out of step by a
 * frame. **Critically damped**, because an overshoot in *height* draws the panel
 * taller than its content measured and flashes the surface behind it at the end
 * of every expand.
 *
 * Restated rather than imported from `Accordion`, so `delacour add collapsible`
 * copies one folder and not two. A test pins the two equal, so the two
 * disclosures cannot drift apart in feel.
 */
export const COLLAPSIBLE_SPRING = { damping: 26, mass: 0.4, stiffness: 400 } as const;

/** Where the indicator points at each end of the travel, in degrees — a half turn. */
export const COLLAPSIBLE_INDICATOR_ROTATION = { collapsed: 0, expanded: 180 } as const;

/**
 * What the measured height holds before the panel has ever reported its layout.
 *
 * Negative rather than zero: a panel that measured `0` is a real answer, and
 * treating it as "still waiting" would never start the spring. Only a value no
 * layout can produce can mean *unmeasured*, so the height style floors it.
 */
export const COLLAPSIBLE_UNMEASURED = -1;

/**
 * The window of the travel the panel's opacity ramps across — ahead of the
 * height, so the content is legible for most of an expand rather than half
 * transparent at its midpoint.
 */
export const COLLAPSIBLE_CONTENT_FADE = { start: 0.1, end: 0.6 } as const;

/**
 * Styling for every part of a collapsible.
 *
 * One slotted `tv()`, because the parts cannot import the root without closing a
 * cycle (AGENTS.md rule 3) yet all of them read the same `size`.
 *
 * **The slots are `Accordion`'s, class for class**, and a test asserts it: a
 * collapsible is one accordion item without the group, and the two on one screen
 * have to read as the same control. What differs is where the state lives, not
 * how it looks.
 *
 * **The disabled fade lands on `root`**, never on `trigger`. The trigger is a
 * `Pressable`, whose `Animated.View` writes `opacity` every frame, so a class on
 * that node is overwritten silently. A collapsible has no item layer between the
 * two, so the root wears it.
 *
 * **`overflow-hidden` on `root`** keeps an expanding panel inside the rounded
 * corner; **on `content`** it is the disclosure itself, since that slot's height
 * is an animated style running below its content's.
 *
 * **`contentInner` is out of flow**, so its height is purely its content's and can
 * never be fed back the clip's own animated one. `left-0 right-0` is the other
 * half: an absolute child is content-width without it, and a paragraph would
 * measure as a single unwrapped line.
 *
 * No slot worn by a `View` carries `text-*` (rule 1). Free of React Native
 * imports so it stays reachable from `bun test`.
 */
export const collapsibleVariants = tv({
	slots: {
		/** The clipped, rounded surface. Wears the disabled fade. */
		root: "overflow-hidden border border-transparent",
		/** The row that opens the panel. A `Pressable`, so it carries no opacity of its own. */
		trigger: "w-full flex-row items-center",
		/** The trigger's text column, taking whatever width the indicator leaves. */
		triggerContent: "min-w-0 flex-1 justify-center gap-0.5",
		/** The box the indicator turns inside. Its rotation is an animated style. */
		indicator: "items-center justify-center",
		/** Edge length any glyph in a collapsible inherits. */
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
				root: "rounded-md",
				trigger: "min-h-12 gap-2.5 px-3 py-3",
				contentInner: "px-3 pb-3",
				glyph: "size-icon-xs",
				title: "text-sm",
				description: "text-xs",
			},
			md: {
				root: "rounded-md",
				trigger: "min-h-14 gap-3 px-4 py-3.5",
				contentInner: "px-4 pb-4",
				glyph: "size-icon-sm",
				title: "text-base",
				description: "text-sm",
			},
			lg: {
				root: "rounded-md",
				trigger: "min-h-16 gap-3.5 px-5 py-4",
				contentInner: "px-5 pb-5",
				glyph: "size-icon-md",
				title: "text-lg",
				description: "text-base",
			},
		},
		// The empty `false` branch is load-bearing typing: a map with only `true`
		// types the prop as `true` rather than `boolean`.
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		variant: COLLAPSIBLE_DEFAULT_VARIANT,
		size: COLLAPSIBLE_DEFAULT_SIZE,
		isDisabled: false,
	},
});

export type CollapsibleVariantProps = VariantProps<typeof collapsibleVariants>;

/** The state a collapsible settles at rest. */
export type CollapsibleState = { isOpen: boolean; isDisabled: boolean };

/**
 * The whole state transition a tap on the trigger makes.
 *
 * A disabled collapsible refuses the tap **in both directions** — it does not
 * close a section that is already open. A disabled control is one that cannot be
 * used, not one that undoes itself. The trigger is also a disabled `Pressable`,
 * so this is the second line rather than the first; it is what keeps a tap that
 * slips through the gesture layer, or a caller's own `toggle()`, honest.
 */
export function toggleCollapsibleOpen({ isOpen, isDisabled }: CollapsibleState): boolean {
	return isDisabled ? isOpen : !isOpen;
}

/** What the trigger and the panel tell assistive technology. */
export type CollapsibleAccessibility = {
	trigger: { expanded: boolean; disabled: boolean };
	content: {
		accessibilityElementsHidden: boolean;
		importantForAccessibility: "auto" | "no-hide-descendants";
	};
};

/**
 * Settles what the trigger and the panel announce, from the settled state.
 *
 * **A closed panel is taken out of the tree**, not merely clipped to zero. The
 * panel stays mounted after its first expand, and mounted content is content a
 * screen reader reads — so a closed one has to say it is not there. Disabling a
 * section does not hide it: an open, disabled panel is still on screen.
 */
export function resolveCollapsibleAccessibility({ isOpen, isDisabled }: CollapsibleState): CollapsibleAccessibility {
	return {
		trigger: { disabled: isDisabled, expanded: isOpen },
		content: {
			accessibilityElementsHidden: !isOpen,
			importantForAccessibility: isOpen ? "auto" : "no-hide-descendants",
		},
	};
}
