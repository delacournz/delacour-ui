import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { PopoverAlign, PopoverPlacement, PopoverWidth } from "./popover.position";

/**
 * What `Popover.Content` does when a prop is left out.
 *
 * Below the trigger and centred on it, 8pt clear of it, as wide as its content.
 */
export const POPOVER_DEFAULTS = {
	placement: "bottom",
	align: "center",
	offset: 8,
	alignOffset: 0,
	width: "content-fit",
} as const satisfies {
	placement: PopoverPlacement;
	align: PopoverAlign;
	offset: number;
	alignOffset: number;
	width: PopoverWidth;
};

/** How far a panel keeps from the safe area's edges, in points. */
export const POPOVER_COLLISION_PADDING = 8;

/** The arrow's square, in points, before it is rotated 45°. Half of it shows past the panel's edge. */
export const POPOVER_ARROW_SIZE = 10;

/**
 * How close the arrow's centre may come to a panel corner, in points.
 *
 * The panel's corner is `rounded-lg`, which is `--radius` — 10pt by default —
 * and a rotated square reaches half its diagonal either side of its centre. Any
 * less and the arrow would hang off the curve of the corner instead of the
 * straight edge. The test pins it against the radius `tokens.css` declares.
 */
export const POPOVER_ARROW_INSET = 18;

/** How far the panel travels on its way in, toward its resolved side. */
export const POPOVER_ENTER_DISTANCE = 6;

/** The scale the panel grows from, at the arrow. */
export const POPOVER_ENTER_SCALE = 0.96;

/** A bare glyph in a corner has no capsule to bring it to 44pt — the slop does. */
export const POPOVER_CLOSE_HIT_SLOP = 8;

/**
 * Styling for every part of a popover.
 *
 * `content` is the panel: the popover token, the hairline, the card corner and
 * the padding — and `isUnstyled` strips all four, keeping only the gap, for a caller drawing their
 * own surface with `background`. The arrow is the same fill with the border on
 * its two outer edges; rotated 45° those are the two that show past the
 * panel's edge, and the two that would draw a seam across the panel stay bare.
 *
 * `dismissLayer` is the invisible full-screen catcher under a scrim-less
 * panel. It paints nothing, and the test holds it to that.
 */
export const popoverVariants = tv({
	slots: {
		scrim: "absolute inset-0 bg-overlay",
		dismissLayer: "absolute inset-0",
		content: "gap-2",
		arrow: "absolute",
		title: "pr-6",
		description: "",
		close: "absolute top-2 right-2 z-10",
	},
	variants: {
		isUnstyled: {
			true: {},
			false: {
				content: "rounded-lg border border-border bg-popover p-3",
				arrow: "border-b border-r border-border bg-popover",
			},
		},
	},
	defaultVariants: {
		isUnstyled: false,
	},
});

export type PopoverVariantProps = VariantProps<typeof popoverVariants>;
