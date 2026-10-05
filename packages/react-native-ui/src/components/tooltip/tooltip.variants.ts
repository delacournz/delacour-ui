import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { PopoverAlign, PopoverPlacement, PopoverWidth } from "../popover/popover.position";

/** The two looks: a dark chip that reads over anything, or a popover card for a title and a line. */
export const TOOLTIP_VARIANTS = ["inverted", "surface"] as const;
export type TooltipVariant = (typeof TOOLTIP_VARIANTS)[number];

/** What opens it: a long press leaves the trigger's own tap alone; a press is for a trigger with no tap of its own. */
export type TooltipOpenOn = "longPress" | "press";

/** The gesture that reached the trigger. */
export type TooltipGesture = "longPress" | "press";

/**
 * What `Tooltip` and `Tooltip.Content` do when a prop is left out.
 *
 * Above the trigger and centred on it, 6pt clear — closer than a popover's 8,
 * because a one-line label belongs to its control — inverted, as wide as its
 * words, opened by a long press.
 */
export const TOOLTIP_DEFAULTS = {
	placement: "top",
	align: "center",
	offset: 6,
	alignOffset: 0,
	width: "content-fit",
	variant: "inverted",
	openOn: "longPress",
} as const satisfies {
	placement: PopoverPlacement;
	align: PopoverAlign;
	offset: number;
	alignOffset: number;
	width: PopoverWidth;
	variant: TooltipVariant;
	openOn: TooltipOpenOn;
};

/** How long a tooltip stays after its entrance settles, in ms. */
export const TOOLTIP_DURATION = 1500;

/** How far the panel travels on its way in, toward its resolved side. No scale — a label just appears. */
export const TOOLTIP_ENTER_DISTANCE = 4;

/**
 * How long the tooltip stays, in ms — `0` for until it is dismissed.
 *
 * A negative or non-finite value is a mistake, not a request to vanish at
 * once, so it falls back to the default. With a screen reader on it never
 * times out: whoever opened it — a press tooltip, for someone using zoom
 * alongside VoiceOver — reads at their own pace, and dismisses it with the
 * trigger or a tap elsewhere.
 */
export function resolveTooltipDuration(
	duration: number | undefined,
	{ isScreenReaderEnabled }: { isScreenReaderEnabled: boolean }
): number {
	if (isScreenReaderEnabled) return 0;
	if (duration === undefined || !Number.isFinite(duration) || duration < 0) return TOOLTIP_DURATION;
	return duration;
}

/**
 * Whether a gesture on the trigger toggles the tooltip.
 *
 * Only the gesture `openOn` names does. With a screen reader on, a long press
 * never opens it: the tooltip's words already reached the trigger as its label
 * or hint, and VoiceOver's double-tap-and-hold is an action, not a request to
 * see a label that is hidden from it anyway. A press tooltip still opens, for a
 * partially sighted user who reads the screen as well as hearing it.
 */
export function shouldTooltipActivate({
	openOn,
	gesture,
	isScreenReaderEnabled,
}: {
	openOn: TooltipOpenOn;
	gesture: TooltipGesture;
	isScreenReaderEnabled: boolean;
}): boolean {
	if (gesture !== openOn) return false;
	return !(isScreenReaderEnabled && gesture === "longPress");
}

export type TooltipAccessibility = { accessibilityLabel?: string; accessibilityHint?: string };

/**
 * What the trigger tells assistive technology, so VoiceOver says the
 * tooltip's words without anything opening.
 *
 * A trigger with no label of its own — an icon button — is named by the
 * tooltip. One that has a label keeps it, and the tooltip becomes its hint;
 * unless the two say the same thing, which would only be read twice.
 */
export function resolveTooltipAccessibility({
	label,
	triggerLabel,
}: {
	label?: string;
	triggerLabel?: string;
}): TooltipAccessibility {
	if (label === undefined || label === "") return {};
	if (triggerLabel === undefined || triggerLabel === "") return { accessibilityLabel: label };
	if (triggerLabel === label) return {};
	return { accessibilityHint: label };
}

/**
 * Styling for every part of a tooltip.
 *
 * `inverted` is the default: the foreground colour as the fill and the
 * background colour as the ink, so it reads over anything in either theme,
 * with a small corner and padding sized for one caption-sized line. `surface`
 * is the popover card — fill, hairline and card corner — with room for a title
 * over a description.
 *
 * The arrow is drawn by Popover's `AnchoredArrow` with its own paint stripped,
 * so the slot here carries all of it: the inverted chip has no border, so its
 * arrow is fill alone; the surface arrow wears the border on its two outer
 * edges, the ones that show past the panel.
 */
export const tooltipVariants = tv({
	slots: {
		content: "",
		arrow: "",
		text: "",
		title: "",
		description: "",
	},
	variants: {
		variant: {
			inverted: {
				content: "gap-0.5 rounded-md bg-foreground px-2 py-1",
				arrow: "bg-foreground",
				text: "text-background",
				title: "text-background",
				description: "text-background/80",
			},
			surface: {
				content: "gap-1 rounded-lg border border-border bg-popover px-3 py-2",
				arrow: "border-b border-r border-border bg-popover",
				text: "text-popover-foreground",
				title: "text-popover-foreground",
				description: "text-muted-foreground",
			},
		},
	},
	defaultVariants: {
		variant: "inverted",
	},
});

export type TooltipVariantProps = VariantProps<typeof tooltipVariants>;
