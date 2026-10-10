/**
 * Every component with a screen in this app, filed the way the documentation
 * files them.
 *
 * A copy of `apps/web/src/lib/components.ts`'s groups, on purpose. The design
 * system must stay app-free and the library ships to consumers, so neither can
 * hold a list that exists to arrange two apps' indexes; `components-index.test.ts`
 * reads the web file back by relative path and fails by name when the two
 * drift. Icons live in `components/component-icons.ts` rather than here, so
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
	{
		slug: "context-menu",
		title: "ContextMenu",
		description: "Hold content for its actions, with a lifted preview",
		group: "Actions",
	},
	{ slug: "menu", title: "Menu", description: "Actions, checkbox and radio rows, submenus", group: "Actions" },
	{ slug: "pressable", title: "Pressable", description: "Gestures, haptics, asChild", group: "Actions" },
	{ slug: "swipe", title: "Swipe", description: "Actions behind a row, full swipe, groups", group: "Actions" },
	{
		slug: "stack-card",
		title: "StackCard",
		description: "Throw, stamps, layouts, undo, decline",
		group: "Actions",
	},
	{
		slug: "slide-button",
		title: "SlideButton",
		description: "Drag to confirm, thresholds, async completion",
		group: "Actions",
	},
	{
		slug: "selection-mode",
		title: "SelectionMode",
		description: "Long press to pick several, then act from a bar",
		group: "Actions",
	},
	{
		slug: "progress-button",
		title: "ProgressButton",
		description: "Hold to confirm, with a fill and a done mark",
		group: "Actions",
	},
	{
		slug: "toggle-button",
		title: "ToggleButton",
		description: "Variants, sizes, single and multiple groups",
		group: "Actions",
	},
	{ slug: "fab", title: "Fab", description: "Pinned, extended, speed dial", group: "Actions" },
	{ slug: "calendar", title: "Calendar", description: "Single, multiple, range, bounds, locale", group: "Forms" },
	{ slug: "checkbox", title: "Checkbox", description: "Colours, sizes, indeterminate, groups", group: "Forms" },
	{ slug: "chip", title: "Chip", description: "Filters, tags, removable tokens", group: "Forms" },
	{ slug: "field", title: "Field", description: "Form layout, grouping, state cascade", group: "Forms" },
	{ slug: "input", title: "Input", description: "Variants, sizes, prefix and suffix", group: "Forms" },
	{ slug: "textarea", title: "Textarea", description: "Rows, auto-grow, character count", group: "Forms" },
	{ slug: "label", title: "Label", description: "Required, invalid and disabled states", group: "Forms" },
	{ slug: "radio", title: "Radio", description: "Groups, selection, sizes, orientation", group: "Forms" },
	{ slug: "rating", title: "Rating", description: "Half stars, read-only, drag, clear", group: "Forms" },
	{ slug: "slider", title: "Slider", description: "Range, orientation, colours, steps", group: "Forms" },
	{ slug: "switch", title: "Switch", description: "Drag or tap, colours, sizes, end content", group: "Forms" },
	{
		slug: "accordion",
		title: "Accordion",
		description: "Selection modes, measured panels, indicators",
		group: "Data display",
	},
	{
		slug: "collapsible",
		title: "Collapsible",
		description: "One section, controlled or not, and an order summary",
		group: "Data display",
	},
	{ slug: "avatar", title: "Avatar", description: "Fallbacks, sizes, badges, groups", group: "Data display" },
	{ slug: "badge", title: "Badge", description: "Variants, colours, sizes, dismiss", group: "Data display" },
	{ slug: "chart", title: "Chart", description: "Line, area, bar, scatter, candlestick, pie", group: "Data display" },
	{ slug: "kpi", title: "Kpi", description: "Trend tones, sparkline layouts, scrub, groups", group: "Data display" },
	{
		slug: "icon",
		title: "Icon",
		description: "The size scale, colour tokens, inherited defaults",
		group: "Data display",
	},
	{ slug: "item", title: "Item", description: "Media, text and actions in a row", group: "Data display" },
	{ slug: "list-group", title: "ListGroup", description: "Grouped rows, dividers, slots", group: "Data display" },
	{ slug: "separator", title: "Separator", description: "Orientations, insets, weight", group: "Data display" },
	{ slug: "text", title: "Text", description: "Type scale, presets, inline nesting", group: "Data display" },
	{ slug: "alert", title: "Alert", description: "Statuses, variants, dismiss, actions", group: "Feedback" },
	{ slug: "meter", title: "Meter", description: "Regions, thresholds, segments, colours", group: "Feedback" },
	{ slug: "progress", title: "Progress", description: "Values, indeterminate, colours, sizes", group: "Feedback" },
	{ slug: "spinner", title: "Spinner", description: "Sizes, colours, custom glyphs", group: "Feedback" },
	{ slug: "skeleton", title: "Skeleton", description: "Shapes, shimmer, groups", group: "Feedback" },
	{
		slug: "empty-state",
		title: "EmptyState",
		description: "Media, title, actions, card variant",
		group: "Feedback",
	},
	{
		slug: "bottom-sheet",
		title: "Bottom sheet",
		description: "Overlay, snap points, sticky footer, keyboard",
		group: "Overlays",
	},
	{
		slug: "toast",
		title: "Toast",
		description: "Statuses, action, placement, promise, stacking, custom",
		group: "Overlays",
	},
	{
		slug: "dialog",
		title: "Dialog",
		description: "Confirm, alert dialog, form, sizes, over a sheet",
		group: "Overlays",
	},
	{
		slug: "popover",
		title: "Popover",
		description: "Placement, flip and shift, arrow, trigger width",
		group: "Overlays",
	},
	{
		slug: "tooltip",
		title: "Tooltip",
		description: "Long press, press, placements, surface, persistent",
		group: "Overlays",
	},
	{
		slug: "drawer",
		title: "Drawer",
		description: "Navigation, filters, notifications, sizes, RTL",
		group: "Overlays",
	},
	{
		slug: "feedback",
		title: "Feedback",
		description: "Basic, sending, multi-step, chips, controlled draft",
		group: "Overlays",
	},
	{ slug: "steps", title: "Steps", description: "Orientation, states, linear flows, panels", group: "Navigation" },
	{ slug: "tabs", title: "Tabs", description: "Variants, sizes, swipe, scrolling", group: "Navigation" },
	{ slug: "screen", title: "Screen", description: "Navbar, footer, scrollables, keyboard", group: "Layout" },
	{ slug: "surface", title: "Surface", description: "Fills, padding, nesting, bleed", group: "Layout" },
	{ slug: "card", title: "Card", description: "Header, action, footer band, sizes", group: "Layout" },
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
	/** The name in kebab-case — `Data display` is `data-display` — and the route's `[group]` segment. */
	readonly slug: string;
	readonly href: Href;
	readonly entries: readonly ComponentIndexRow[];
};

/** How many titles a group's summary names before it counts the rest. */
const SUMMARY_NAMED = 3;

/** How many components have a screen — the navbar's subtitle, derived rather than typed. */
export function componentCount(): number {
	return COMPONENT_INDEX.length;
}

/**
 * The index as `/components` draws it: the docs' group order, alphabetical
 * inside each, and no row for an empty group. Each group is a screen of its
 * own at `/components/<slug>`.
 */
export function groupedComponents(): readonly ComponentGroupSection[] {
	return COMPONENT_GROUPS.map((name) => {
		const slug = name.toLowerCase().replaceAll(" ", "-");

		return {
			name,
			slug,
			href: `/components/${slug}` as const,
			entries: COMPONENT_INDEX.filter((entry) => entry.group === name).sort((a, b) => a.title.localeCompare(b.title)),
		};
	}).filter((group) => group.entries.length > 0);
}

/** The group a `[group]` route segment names, or `undefined` for a slug no group has. */
export function componentGroup(slug: string | undefined): ComponentGroupSection | undefined {
	return groupedComponents().find((group) => group.slug === slug);
}

/**
 * A group's row description: its first few titles, then a count of the rest —
 * enough to say what is inside without the row wrapping to four lines.
 */
export function groupSummary(entries: readonly { readonly title: string }[]): string {
	const named = entries
		.slice(0, SUMMARY_NAMED)
		.map((entry) => entry.title)
		.join(", ");
	const rest = entries.length - SUMMARY_NAMED;

	return rest > 0 ? `${named} and ${rest} more` : named;
}
