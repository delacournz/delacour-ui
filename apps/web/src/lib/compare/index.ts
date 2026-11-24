import { COMPARE_COPY } from "../comparison";
import { BNA_UI } from "./bna-ui";
import { REACT_NATIVE_REUSABLES } from "./react-native-reusables";
import type { Comparison } from "./types";

export type { CompareSource, Comparison, TwoWayRow, TwoWaySection } from "./types";

/** Every two-way comparison `/compare/$slug` renders. HeroUI has its own, three-column page. */
export const COMPARISONS: readonly Comparison[] = [REACT_NATIVE_REUSABLES, BNA_UI];

export function comparisonBySlug(slug: string): Comparison | undefined {
	return COMPARISONS.find((comparison) => comparison.slug === slug);
}

/** A card on `/compare`. */
export type HubEntry = { readonly name: string; readonly summary: string; readonly path: string };

/** The hub, in the order a reader searching "shadcn for React Native" meets them. */
export const HUB_ENTRIES: readonly HubEntry[] = [
	...COMPARISONS.map((comparison) => ({
		name: comparison.name,
		summary: comparison.summary,
		path: `/compare/${comparison.slug}`,
	})),
	{ name: "HeroUI Native", summary: COMPARE_COPY.description, path: "/compare/heroui" },
];

export const HUB_COPY = {
	title: "Compare React Native UI libraries — Delacour UI",
	description:
		"Delacour UI next to React Native Reusables, BNA UI and HeroUI Native: where the code lives, how it is styled and themed, and what each one covers.",
	eyebrow: "Compare",
	headline: "Delacour UI next to the alternatives.",
	lede: "Every comparison here is a table of sourced rows, and every table has rows the other library wins. Pick the one you are weighing.",
} as const;
