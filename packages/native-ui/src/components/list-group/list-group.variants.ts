import { tv, type VariantProps } from "tailwind-variants";

export const LIST_GROUP_VARIANTS = ["default", "secondary", "tertiary", "transparent"] as const;

export const LIST_GROUP_SIZES = ["sm", "md", "lg"] as const;

export const LIST_GROUP_ITEM_FEEDBACKS = ["fade", "scale", "none"] as const;

export type ListGroupVariant = (typeof LIST_GROUP_VARIANTS)[number];
export type ListGroupSize = (typeof LIST_GROUP_SIZES)[number];
export type ListGroupItemFeedback = (typeof LIST_GROUP_ITEM_FEEDBACKS)[number];

/** Edge length paired with each size for an icon in `ListGroup.ItemPrefix`, in points. */
export const LIST_GROUP_ICON_SIZE: Record<ListGroupSize, number> = {
	sm: 18,
	md: 22,
	lg: 24,
};

/** Edge length paired with each size for the default trailing chevron, in points. */
export const LIST_GROUP_SUFFIX_ICON_SIZE: Record<ListGroupSize, number> = {
	sm: 14,
	md: 16,
	lg: 18,
};

/** Theme token an icon in `ListGroup.ItemPrefix` inherits. */
export const LIST_GROUP_FOREGROUND_TOKEN = "foreground";

/** Theme token the default trailing chevron inherits. */
export const LIST_GROUP_SUFFIX_ICON_TOKEN = "muted-foreground";

/**
 * How a row moves under a press, as the two values `Pressable` interpolates
 * towards — 1 being the neutral value on either axis.
 *
 * `fade` is the default because a full-bleed row that scales reads as the whole
 * card flexing rather than as one row responding. There is no third option
 * involving a highlight or ripple layer; AGENTS.md rules those out.
 */
export const LIST_GROUP_ITEM_FEEDBACK: Record<ListGroupItemFeedback, { opacity: number; scale: number }> = {
	fade: { opacity: 0.6, scale: 1 },
	scale: { opacity: 1, scale: 0.97 },
	none: { opacity: 1, scale: 1 },
};

/**
 * Styling for the list group root.
 *
 * `overflow-hidden` is load-bearing rather than tidiness: a pressed row fades to
 * the edge of its own box, and the first and last rows would square off the
 * group's corners without it.
 *
 * Holds no `text-*` utility — a React Native `View` does not cascade colour to a
 * `Text` descendant, so the text tokens live on the title and description.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const listGroupVariants = tv({
	base: "overflow-hidden border border-transparent",
	variants: {
		variant: {
			default: "border-border bg-card",
			secondary: "bg-secondary",
			tertiary: "bg-tertiary",
			transparent: "bg-transparent",
		},
		size: {
			sm: "rounded-xl",
			md: "rounded-2xl",
			lg: "rounded-2xl",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "md",
	},
});

/**
 * Styling for a row.
 *
 * `w-full` matters because the root clips: without it a short row leaves the
 * press feedback ending mid-card instead of spanning it.
 */
export const listGroupItemVariants = tv({
	base: "w-full flex-row items-center",
	variants: {
		size: {
			sm: "min-h-12 gap-2.5 px-3 py-2",
			md: "min-h-14 gap-3 px-4 py-3",
			lg: "min-h-16 gap-3.5 px-5 py-4",
		},
		isDisabled: {
			true: "opacity-50",
			false: "",
		},
	},
	defaultVariants: {
		size: "md",
		isDisabled: false,
	},
});

/**
 * Inset for a divider the root inserts between two rows.
 *
 * Positioning only — the line itself is a `Separator`. The inset tracks
 * {@link listGroupItemVariants}' horizontal padding at each size, so the divider
 * starts where the row's content does; the paired test asserts the two together
 * rather than pinning either on its own.
 */
export const listGroupDividerVariants = tv({
	base: "",
	variants: {
		size: {
			sm: "mx-3",
			md: "mx-4",
			lg: "mx-5",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

/** Styling for the leading slot of a row. */
export const listGroupItemPrefixVariants = tv({
	base: "items-center justify-center",
});

/** Styling for the text column of a row. */
export const listGroupItemContentVariants = tv({
	base: "flex-1 justify-center gap-0.5",
});

/** Styling for the trailing slot of a row. */
export const listGroupItemSuffixVariants = tv({
	base: "items-center justify-center",
});

/** Styling for a row's title. Owns the foreground colour, which the row must not. */
export const listGroupItemTitleVariants = tv({
	base: "font-medium text-foreground",
	variants: {
		size: {
			sm: "text-sm",
			md: "text-base",
			lg: "text-lg",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

/** Styling for a row's description. One step down the scale from its title. */
export const listGroupItemDescriptionVariants = tv({
	base: "text-muted-foreground",
	variants: {
		size: {
			sm: "text-xs",
			md: "text-sm",
			lg: "text-base",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

export type ListGroupVariantProps = VariantProps<typeof listGroupVariants>;
