/**
 * Every component with a screen in this app, filed the way the documentation
 * files them.
 *
 * A copy of `apps/web/src/lib/components.ts`'s groups, on purpose. The design
 * system must stay app-free and the library ships to consumers, so neither can
 * hold a list that exists to arrange two apps' indexes; `components-index.test.ts`
 * reads the web file back by relative path and fails by name when the two
 * drift. Icons live beside the rows in `app/index.tsx` rather than here, so
 * `bun test` can load this file without React Native.
 *
 * `slug` is the route, the demo folder and the docs page in one string; the
 * test holds `href` to it.
 */

import type { Href } from "expo-router";

export const COMPONENT_GROUPS = [
	"Actions",
	"Forms",
	"Data display",
	"Feedback",
	"Overlays",
	"Navigation",
	"Layout",
	"Utilities",
] as const;

export type ComponentGroup = (typeof COMPONENT_GROUPS)[number];

export type ComponentIndexEntry = {
	readonly slug: string;
	/** A typed route — `Href` is a type import, so `bun test` loads this file without expo-router. */
	readonly href: Href;
	readonly title: string;
	/** What the gallery shows, in a handful of words. */
	readonly description: string;
	readonly group: ComponentGroup;
};

const ROWS = [
	{ slug: "button", title: "Button", description: "Variants, sizes, icons, loading", group: "Actions" },
	{ slug: "pressable", title: "Pressable", description: "Gestures, haptics, asChild", group: "Actions" },
	{ slug: "checkbox", title: "Checkbox", description: "Colours, sizes, indeterminate, groups", group: "Forms" },
	{ slug: "field", title: "Field", description: "Form layout, grouping, state cascade", group: "Forms" },
	{ slug: "input", title: "Input", description: "Variants, sizes, prefix and suffix", group: "Forms" },
	{ slug: "radio", title: "Radio", description: "Groups, selection, sizes, orientation", group: "Forms" },
	{ slug: "slider", title: "Slider", description: "Range, orientation, colours, steps", group: "Forms" },
	{ slug: "switch", title: "Switch", description: "Drag or tap, colours, sizes, end content", group: "Forms" },
	{
		slug: "accordion",
		title: "Accordion",
		description: "Selection modes, measured panels, indicators",
		group: "Data display",
	},
	{ slug: "badge", title: "Badge", description: "Variants, colours, sizes, dismiss", group: "Data display" },
	{ slug: "chart", title: "Chart", description: "Line, area, bar, scatter, candlestick, pie", group: "Data display" },
	{
		slug: "icon",
		title: "Icon",
		description: "The size scale, colour tokens, inherited defaults",
		group: "Data display",
	},
	{ slug: "list-group", title: "ListGroup", description: "Grouped rows, dividers, slots", group: "Data display" },
	{ slug: "separator", title: "Separator", description: "Orientations, insets, weight", group: "Data display" },
	{ slug: "text", title: "Text", description: "Type scale, presets, inline nesting", group: "Data display" },
	{ slug: "spinner", title: "Spinner", description: "Sizes, colours, custom glyphs", group: "Feedback" },
	{
		slug: "bottom-sheet",
		title: "Bottom sheet",
		description: "Overlay, snap points, sticky footer, keyboard",
		group: "Overlays",
	},
	{ slug: "tabs", title: "Tabs", description: "Variants, sizes, swipe, scrolling", group: "Navigation" },
	{ slug: "screen", title: "Screen", description: "Navbar, footer, scrollables, keyboard", group: "Layout" },
] as const satisfies readonly Omit<ComponentIndexEntry, "href">[];

/** A slug with a screen, as a literal union so a row without an icon is a type error. */
export type ComponentSlug = (typeof ROWS)[number]["slug"];

export type ComponentIndexRow = ComponentIndexEntry & { readonly slug: ComponentSlug };

export const COMPONENT_INDEX: readonly ComponentIndexRow[] = ROWS.map((entry) => ({
	...entry,
	href: `/${entry.slug}` as const,
}));

export type ComponentGroupSection = {
	readonly name: ComponentGroup;
	readonly entries: readonly ComponentIndexRow[];
};

/** How many components have a screen — the navbar's subtitle, derived rather than typed. */
export function componentCount(): number {
	return COMPONENT_INDEX.length;
}

/**
 * The index as the home screen draws it: the docs' group order, alphabetical
 * inside each, and no heading over an empty group.
 */
export function groupedComponents(): readonly ComponentGroupSection[] {
	return COMPONENT_GROUPS.map((name) => ({
		name,
		entries: COMPONENT_INDEX.filter((entry) => entry.group === name).sort((a, b) => a.title.localeCompare(b.title)),
	})).filter((group) => group.entries.length > 0);
}
