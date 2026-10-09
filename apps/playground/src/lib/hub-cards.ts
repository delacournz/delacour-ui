import { DELACOUR_STROKE_COLOUR } from "@delacour/brand";
import type { Href } from "expo-router";
import { BLOCKS } from "@/blocks/block-index";
import { componentCount } from "@/components-index";

/** The corner a card's glow blooms from. */
export type GlowCorner = "top-left" | "bottom-right";

export type HubCard = {
	readonly slug: "components" | "blocks";
	readonly href: Href;
	readonly title: string;
	readonly description: string;
	readonly count: number;
	/**
	 * A theme token or a literal colour, read with `useThemeColor` (a literal
	 * passes straight through), where it blooms from, and its alpha at the source. `primary` is near-black in light and near-white in
	 * dark, so it takes half the strength a chromatic token does.
	 */
	readonly glow: { readonly token: string; readonly corner: GlowCorner; readonly opacity: number };
};

/**
 * The two doors the app opens on: the component galleries and the blocks.
 *
 * Each count is read from the index its list screen draws, so the number on a
 * card can never disagree with the rows behind it. The glows sit in opposite
 * corners so the two cards read as two places rather than one card twice.
 *
 * Components blooms in the brand amber — the mark's own stroke, sitting in the
 * navbar just above it — rather than a theme token: the hub is the brand's front
 * door, and no theme token is that colour.
 */
export const HUB_CARDS: readonly HubCard[] = [
	{
		slug: "components",
		href: "/components",
		title: "Components",
		description: "Explore every component",
		count: componentCount(),
		glow: { token: DELACOUR_STROKE_COLOUR, corner: "bottom-right", opacity: 0.32 },
	},
	{
		slug: "blocks",
		href: "/blocks",
		title: "Blocks",
		description: "Key screens composed from the library",
		count: BLOCKS.length,
		glow: { token: "primary", corner: "top-left", opacity: 0.16 },
	},
];
