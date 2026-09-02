/**
 * Every component, once.
 *
 * This list existed three times before: hard-coded in the landing page, as
 * `<Card>`s in `content/docs/native/components/index.mdx`, and as the `pages`
 * array in that folder's `meta.json`. The first two are now this file; the
 * third stays hand-maintained, because Fumadocs owns it and reads it for the
 * sidebar rather than for a card grid.
 *
 * Group order is the reading order of the components index and the sidebar.
 */

export type ComponentGroup = (typeof COMPONENT_GROUPS)[number];

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

export type ComponentEntry = {
	/** The URL segment, the demo folder name, and the manifest's component key. */
	readonly slug: string;
	readonly name: string;
	readonly group: ComponentGroup;
	/** One sentence, shown on the card. */
	readonly blurb: string;
};

export const COMPONENTS: readonly ComponentEntry[] = [
	{
		slug: "button",
		name: "Button",
		group: "Actions",
		blurb: "A pressable action, with composed icons and a loading state that costs no layout.",
	},
	{
		slug: "pressable",
		name: "Pressable",
		group: "Actions",
		blurb: "The Gesture API primitive every pressable in the library is built on.",
	},
	{
		slug: "field",
		name: "Field",
		group: "Forms",
		blurb: "A form field's layout, and the one place its state is written down.",
	},
	{ slug: "input", name: "Input", group: "Forms", blurb: "A text field, and the box that can hold content beside it." },
	{
		slug: "checkbox",
		name: "Checkbox",
		group: "Forms",
		blurb: "A box that is ticked or not \u2014 alone, or as one of a group sharing a value list.",
	},
	{ slug: "radio", name: "Radio", group: "Forms", blurb: "One choice from a set, with a trailing indicator row." },
	{
		slug: "switch",
		name: "Switch",
		group: "Forms",
		blurb: "An on/off control with a thumb you can drag as well as tap.",
	},
	{
		slug: "chart",
		name: "Chart",
		group: "Data display",
		blurb: "Line and area marks drawn in Skia, coloured from the theme's five-slot series ramp.",
	},
	{
		slug: "slider",
		name: "Slider",
		group: "Forms",
		blurb: "A value picked from a range by dragging a handle along a track.",
	},
	{
		slug: "text",
		name: "Text",
		group: "Data display",
		blurb: "The type scale, and the one component that reproduces React Native's text inheritance.",
	},
	{ slug: "badge", name: "Badge", group: "Data display", blurb: "A compact label for status, category or count." },
	{ slug: "icon", name: "Icon", group: "Data display", blurb: "Central Icons, sized and coloured by inheritance." },
	{
		slug: "list-group",
		name: "ListGroup",
		group: "Data display",
		blurb: "A surface grouping related rows, with dividers inserted for you.",
	},
	{
		slug: "separator",
		name: "Separator",
		group: "Data display",
		blurb: "A one-pixel rule, hidden from assistive technology.",
	},
	{
		slug: "accordion",
		name: "Accordion",
		group: "Data display",
		blurb: "Sections that expand and collapse, animated from a measured height.",
	},
	{
		slug: "spinner",
		name: "Spinner",
		group: "Feedback",
		blurb: "An animated loading indicator that stands in for an icon.",
	},
	{
		slug: "bottom-sheet",
		name: "BottomSheet",
		group: "Overlays",
		blurb: "A sheet that rises from the bottom edge, built on @gorhom/bottom-sheet.",
	},
	{
		slug: "tabs",
		name: "Tabs",
		group: "Navigation",
		blurb: "A row of tabs and the panels they switch between, with a swipeable pager.",
	},
	{
		slug: "screen",
		name: "Screen",
		group: "Layout",
		blurb: "A screen's frame: pinned chrome, a content region, and whatever scrolls between them.",
	},
	{
		slug: "provider",
		name: "DelacourProvider",
		group: "Utilities",
		blurb: "Every provider an app needs at its root, in one component.",
	},
];

/** The components in a group, in declaration order. */
export function componentsInGroup(group: ComponentGroup): readonly ComponentEntry[] {
	return COMPONENTS.filter((component) => component.group === group);
}

/**
 * Components with no screen in the playground.
 *
 * `DelacourProvider` has nothing to render on its own — every route in the
 * playground already sits downstream of it — so it has no route to deep-link
 * into, and no "Scan to preview" button. The same exception, for the same
 * reason, as `COMPONENTS_WITHOUT_DEMOS` in `apps/playground/src/demos/demos.test.ts`.
 */
export const COMPONENTS_WITHOUT_SCREENS: ReadonlySet<string> = new Set(["provider"]);

/** The slugs a playground link can name. Kept honest by `components.test.ts`. */
export const PLAYGROUND_SLUGS: readonly string[] = COMPONENTS.map((component) => component.slug).filter(
	(slug) => !COMPONENTS_WITHOUT_SCREENS.has(slug)
);

/** Does this slug have a screen to open? */
export function hasPlaygroundScreen(slug: string): boolean {
	return PLAYGROUND_SLUGS.includes(slug);
}

/** A component page's path under `content/docs`, as Fumadocs reports it. */
const DOCS_COMPONENT_PATH = /^native\/components\/([a-z0-9-]+)\.mdx$/;

/**
 * The playground slug for a documentation page, or `null` if the page has none.
 *
 * `null` covers three cases the docs toolbar must not offer a QR for: a page
 * outside `native/components`, that folder's `index.mdx`, and a component with
 * no screen in the playground.
 */
export function playgroundSlugForDocsPath(path: string): string | null {
	const slug = DOCS_COMPONENT_PATH.exec(path)?.[1];
	return slug !== undefined && hasPlaygroundScreen(slug) ? slug : null;
}
