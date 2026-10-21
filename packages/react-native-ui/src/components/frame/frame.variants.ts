import { Children, type ReactNode } from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ListGroupSize, ListGroupVariant } from "../list-group/list-group.variants";
import { resolveSurfaceVariant, type SurfacePlane, type SurfaceVariant } from "../surface/surface.variants";

export const FRAME_VARIANTS = ["default", "plain", "inset"] as const;

export const FRAME_SIZES = ["sm", "md", "lg"] as const;

export const FRAME_FOOTER_ALIGNS = ["start", "end", "between", "stretch"] as const;

/**
 * The planes a frame's title can sit on: the three surface fills, plus `none`
 * for a plain frame on the page, which has no fill beneath it at all.
 */
export const FRAME_PLANES = ["default", "secondary", "tertiary", "none"] as const;

export type FrameVariant = (typeof FRAME_VARIANTS)[number];
export type FrameSize = (typeof FRAME_SIZES)[number];
export type FrameFooterAlign = (typeof FRAME_FOOTER_ALIGNS)[number];
export type FramePlane = (typeof FRAME_PLANES)[number];

/** Which rule sits between two adjacent children of a tray. */
export type FrameDivider = "inset" | "full";

/**
 * Styling for every part of a frame.
 *
 * The shell is a fill, a card corner and a padding, and nothing else. The fill
 * is written twice on purpose: the `default` and `inset` variants name
 * `bg-secondary` so the class string reads whole on its own, and the `fill`
 * axis — the step {@link resolveFrameRootVariant} actually landed on — is
 * emitted after it, so tailwind-merge keeps the resolved one. A frame inside a
 * secondary surface paints `bg-tertiary` and never vanishes into its parent.
 *
 * `default` is a 4pt lip, so the shell reads as the edge of a tray the card sits
 * in; `inset` is an 8pt band on every side, wide enough to hold the footer.
 * `plain` paints nothing and pads nothing, for a frame already inside a
 * bordered container.
 *
 * The header and the footer carry their own horizontal inset per variant so the
 * title lines up with the rows' text: a `default` header's `px-3` plus the
 * shell's `p-1` is the 16pt a `md` row is padded by.
 *
 * Size drives two things only — the title's step on the type scale and the
 * section caption's inset, which tracks the ListGroup row padding at the same
 * size so a caption starts where the row text below it starts. The rows
 * themselves take their metrics from the ListGroup the tray publishes.
 *
 * The title colour is keyed on `plane`, the fill the title actually sits on,
 * written out per plane because Tailwind's scanner cannot see a class built at
 * runtime.
 *
 * `min-h-11` on the action is the 44pt hit target a text link would otherwise
 * not have; `-my-2` claws that height back out of the header so the strip stays
 * as tall as its type.
 *
 * No slot carries a shadow — nothing in this package casts one — and the layout
 * slots carry no `text-*` colour (rule 1): a `View` cannot cascade one.
 *
 * Free of React Native imports so it stays pure and unit-testable. See AGENTS.md.
 */
export const frameVariants = tv({
	slots: {
		root: "flex-col",
		header: "flex-row items-center gap-3",
		/** The column holding the title and description, beside any action. */
		headerText: "flex-1 gap-0.5",
		title: "font-semibold",
		description: "text-muted-foreground",
		action: "-my-2 min-h-11 shrink-0 flex-row items-center justify-center",
		actionLabel: "font-medium text-primary",
		section: "flex-col",
		sectionTitle: "pt-3 pb-1 font-medium text-muted-foreground text-xs",
		footer: "flex-row flex-wrap items-center gap-2",
	},
	variants: {
		variant: {
			default: {
				root: "rounded-lg border-continuous bg-secondary p-1",
				header: "px-3 pt-2 pb-2",
				footer: "px-3 py-2",
			},
			plain: {
				header: "pb-2",
				footer: "pt-3",
			},
			inset: {
				root: "rounded-lg border-continuous bg-secondary p-2",
				header: "px-2 pb-2",
				footer: "px-2 pt-3",
			},
		},
		fill: {
			default: { root: "bg-card" },
			secondary: { root: "bg-secondary" },
			tertiary: { root: "bg-tertiary" },
			transparent: {},
		},
		size: {
			sm: { title: "text-sm", description: "text-xs", actionLabel: "text-xs", sectionTitle: "px-3" },
			md: { title: "text-base", description: "text-sm", actionLabel: "text-sm", sectionTitle: "px-4" },
			lg: { title: "text-lg", description: "text-base", actionLabel: "text-base", sectionTitle: "px-5" },
		},
		plane: {
			default: { title: "text-card-foreground" },
			secondary: { title: "text-secondary-foreground" },
			tertiary: { title: "text-tertiary-foreground" },
			none: { title: "text-foreground" },
		},
		align: {
			start: { footer: "justify-start" },
			end: { footer: "justify-end" },
			between: { footer: "justify-between" },
			stretch: {},
		},
		// The empty `false` branch types the prop as `boolean` rather than `true`.
		// See the note in button.variants.ts.
		isDisabled: { true: { action: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		variant: "default",
		size: "md",
		plane: "secondary",
		align: "end",
		isDisabled: false,
	},
});

export type FrameVariantProps = VariantProps<typeof frameVariants>;

/**
 * The fill a frame's shell paints.
 *
 * `plain` paints none. The other two take the secondary fill on the page, and
 * inside another surface step one rung down the ladder from it — the same step
 * a nested `Surface` would take — so the shell is never the colour of what it
 * sits in. A frame in a `Card` is secondary; a frame in a secondary panel is
 * tertiary.
 */
export function resolveFrameRootVariant(variant: FrameVariant, parentPlane: SurfacePlane | null): SurfaceVariant {
	if (variant === "plain") return "transparent";
	if (!parentPlane) return "secondary";
	return resolveSurfaceVariant({ parentPlane });
}

/**
 * The fill of the tray, which is a ListGroup: always the card. On a filled
 * shell that is what makes the rows read as a card set into a tray; on a plain
 * frame it is the card the rows would have been in anyway.
 */
export function resolveFrameTrayVariant(_variant: FrameVariant): ListGroupVariant {
	return "default";
}

/** The ListGroup size the tray takes — the frame's own, one for one. */
export function resolveFrameTraySize(size: FrameSize): ListGroupSize {
	return size;
}

/**
 * How a footer lays its children out: a justify class for the row, and a class
 * for each child. `stretch` names no justify at all — every child grows to an
 * equal share instead, which is what a pair of decision buttons wants.
 */
export function resolveFrameFooterJustify(align: FrameFooterAlign): { justify: string; item: string } {
	switch (align) {
		case "start":
			return { item: "", justify: "justify-start" };
		case "end":
			return { item: "", justify: "justify-end" };
		case "between":
			return { item: "", justify: "justify-between" };
		case "stretch":
			return { item: "flex-1", justify: "" };
	}
}

/**
 * The rule between two adjacent tray children. Two rows are divided by a rule
 * inset to their padding, the ListGroup convention; a section on either side
 * takes a full-bleed rule, so a cluster reads as a break in the card rather than
 * as one more row.
 */
export function resolveFrameDivider(previousIsSection: boolean, nextIsSection: boolean): FrameDivider {
	return previousIsSection || nextIsSection ? "full" : "inset";
}

/**
 * Splits a header's children into its text column and its trailing actions.
 *
 * A header is a row — the title and description stacked on the left, the action
 * on the right — and React Native has no grid to place a child by type. So the
 * header walks its children and lifts every action out, keeping the rest in
 * order. `Children.toArray` drops the nulls and booleans a conditional child
 * leaves behind.
 *
 * `isAction` is passed in rather than imported so this stays free of the part
 * it looks for, and of React Native with it.
 */
export function splitFrameHeaderChildren(
	children: ReactNode,
	isAction: (node: ReactNode) => boolean
): { text: ReactNode[]; actions: ReactNode[] } {
	const text: ReactNode[] = [];
	const actions: ReactNode[] = [];

	for (const child of Children.toArray(children)) {
		(isAction(child) ? actions : text).push(child);
	}

	return { actions, text };
}
