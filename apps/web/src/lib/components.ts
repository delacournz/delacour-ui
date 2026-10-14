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
		slug: "context-menu",
		name: "ContextMenu",
		group: "Actions",
		blurb: "The actions that belong to a piece of content, reached by holding it \u2014 with a lifted preview.",
	},
	{
		slug: "menu",
		name: "Menu",
		group: "Actions",
		blurb:
			"A list of actions dropped from the control that opens it \u2014 with checkbox, radio and in-place submenu rows.",
	},
	{
		slug: "pressable",
		name: "Pressable",
		group: "Actions",
		blurb: "The Gesture API primitive every pressable in the library is built on.",
	},
	{
		slug: "swipe",
		name: "Swipe",
		group: "Actions",
		blurb: "A row that slides aside to reveal actions behind it, with a full swipe that fires the outermost.",
	},
	{
		slug: "stack-card",
		name: "StackCard",
		group: "Actions",
		blurb: "A deck taken one card at a time by throwing the top one off \u2014 one decision per card.",
	},
	{
		slug: "slide-button",
		name: "SlideButton",
		group: "Actions",
		blurb: "A handle dragged across a rail to confirm — for an action a stray tap should never reach.",
	},
	{
		slug: "selection-mode",
		name: "SelectionMode",
		group: "Actions",
		blurb: "Pick several things at once \u2014 a long press enters the mode \u2014 then act on them from a bar.",
	},
	{
		slug: "progress-button",
		name: "ProgressButton",
		group: "Actions",
		blurb: "A button held, not tapped, to confirm \u2014 the action fires when the fill reaches the end.",
	},
	{
		slug: "toggle-button",
		name: "ToggleButton",
		group: "Actions",
		blurb: "A button that stays pressed \u2014 alone, or in a group choosing one option or several.",
	},
	{
		slug: "fab",
		name: "Fab",
		group: "Actions",
		blurb: "One primary action floating over the screen, extended with a label or unfolding a dial.",
	},
	{
		slug: "field",
		name: "Field",
		group: "Forms",
		blurb: "A form field's layout, and the one place its state is written down.",
	},
	{ slug: "input", name: "Input", group: "Forms", blurb: "A text field, and the box that can hold content beside it." },
	{ slug: "textarea", name: "Textarea", group: "Forms", blurb: "A multiline text field, sized in rows." },
	{
		slug: "theme-selector",
		name: "ThemeSelector",
		group: "Forms",
		blurb: "System, Light or Dark \u2014 read from the live theme, and applied to it.",
	},
	{
		slug: "tag-input",
		name: "TagInput",
		group: "Forms",
		blurb: "Free-form tags typed into one field box, each a removable chip.",
	},
	{
		slug: "otp-input",
		name: "OtpInput",
		group: "Forms",
		blurb: "A one-time code or PIN \u2014 cells drawn over one hidden field, with autofill and paste.",
	},
	{
		slug: "number-input",
		name: "NumberInput",
		group: "Forms",
		blurb: "A number between a minus and a plus \u2014 tap, hold to repeat, or type.",
	},
	{
		slug: "markdown-editor",
		name: "MarkdownEditor",
		group: "Forms",
		blurb: "A Markdown field \u2014 a formatting toolbar, a write pane and a rendered preview.",
	},
	{
		slug: "label",
		name: "Label",
		group: "Forms",
		blurb: "A form control's name, with required, invalid and disabled states.",
	},
	{
		slug: "checkbox",
		name: "Checkbox",
		group: "Forms",
		blurb: "A box that is ticked or not \u2014 alone, or as one of a group sharing a value list.",
	},
	{
		slug: "chip",
		name: "Chip",
		group: "Forms",
		blurb: "An interactive pill — a filter that toggles, a tag, or a token with a remove control.",
	},
	{
		slug: "combobox",
		name: "Combobox",
		group: "Forms",
		blurb: "A long or remote list behind a field-shaped trigger, filtered as you type in a bottom sheet.",
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
		blurb:
			"Line, area, bar, scatter, candlestick and pie marks drawn in Skia, coloured from the theme's five-slot series ramp.",
	},
	{
		slug: "flow",
		name: "Flow",
		group: "Data display",
		blurb: "A pan-and-zoom canvas of nodes joined by edges that route themselves, for pipelines and builders.",
	},
	{
		slug: "countdown",
		name: "Countdown",
		group: "Data display",
		blurb:
			"Time left until a fixed moment, read from the wall clock on every tick, in sliding segmented digits or one inline run.",
	},
	{
		slug: "kpi",
		name: "Kpi",
		group: "Data display",
		blurb: "One number, its change coloured by what it means, and a sparkline of how it got there.",
	},
	{
		slug: "questionnaire",
		name: "Questionnaire",
		group: "Forms",
		blurb: "A guided form, one question at a time, with branching, skips, validation and progress.",
	},
	{
		slug: "color-picker",
		name: "ColorPicker",
		group: "Forms",
		blurb: "A colour picked by dragging an area and a hue track, typed as hex, or tapped from swatches.",
	},
	{
		slug: "timeline",
		name: "Timeline",
		group: "Data display",
		blurb: "Dated events down a rail or across a snapping strip — progress fills the rail, tone tints the marker.",
	},
	{
		slug: "planner",
		name: "Planner",
		group: "Data display",
		blurb: "A month of days, each showing what falls on it, with a sheet of the selected day.",
	},
	{
		slug: "leaderboard",
		name: "Leaderboard",
		group: "Data display",
		blurb:
			"Ranked people or teams with ties, the top three on a podium, and the highlighted entry pinned below the cut.",
	},
	{
		slug: "calendar",
		name: "Calendar",
		group: "Forms",
		blurb: "A month grid for picking a day, several days or a range, with no date library and no time zone.",
	},
	{
		slug: "rating",
		name: "Rating",
		group: "Forms",
		blurb: "A row of stars that reads or sets a score, in whole or half steps.",
	},
	{
		slug: "signature",
		name: "Signature",
		group: "Forms",
		blurb: "A pad to sign with a finger, handing back the strokes as JSON or as an SVG.",
	},
	{
		slug: "select",
		name: "Select",
		group: "Forms",
		blurb: "A closed set of choices behind a field-shaped trigger, picked from a bottom sheet.",
	},
	{
		slug: "search-bar",
		name: "SearchBar",
		group: "Forms",
		blurb: "The query field at the top of a list, with clear, Cancel, debounced reporting and filter tokens.",
	},
	{
		slug: "slider",
		name: "Slider",
		group: "Forms",
		blurb: "A value picked from a range by dragging a handle along a track.",
	},
	{
		slug: "time-picker",
		name: "TimePicker",
		group: "Forms",
		blurb: "A time of day on snapping wheels, in a bottom sheet or inline.",
	},
	{
		slug: "text",
		name: "Text",
		group: "Data display",
		blurb: "The type scale, and the one component that reproduces React Native's text inheritance.",
	},
	{
		slug: "avatar",
		name: "Avatar",
		group: "Data display",
		blurb: "A person as a picture, with an initials fallback, a corner badge and a stack.",
	},
	{ slug: "badge", name: "Badge", group: "Data display", blurb: "A compact label for status, category or count." },
	{ slug: "icon", name: "Icon", group: "Data display", blurb: "Central Icons, sized and coloured by inheritance." },
	{
		slug: "item",
		name: "Item",
		group: "Data display",
		blurb: "A row of media, text and actions — standalone, or as a ListGroup row.",
	},
	{
		slug: "list-group",
		name: "ListGroup",
		group: "Data display",
		blurb: "A surface grouping related rows, with dividers inserted for you.",
	},
	{
		slug: "table",
		name: "Table",
		group: "Data display",
		blurb: "Rows and columns of short values, lined up by one set of column rules.",
	},
	{
		slug: "map",
		name: "Map",
		group: "Data display",
		blurb: "Places and paths on a themed map — markers, labels, popups, routes, arcs and controls.",
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
		slug: "alert",
		name: "Alert",
		group: "Feedback",
		blurb: "A status message with a glyph picked from its status, a title, a description and an optional action.",
	},
	{
		slug: "animated-badge",
		name: "AnimatedBadge",
		group: "Feedback",
		blurb: "A status pill that rolls its content and springs its width when the status changes.",
	},
	{
		slug: "collapsible",
		name: "Collapsible",
		group: "Data display",
		blurb: "One section shown and hidden by its own trigger.",
	},
	{
		slug: "marker",
		name: "Marker",
		group: "Feedback",
		blurb: "A centred inline note for a step or a day break between conversation turns.",
	},
	{
		slug: "meter",
		name: "Meter",
		group: "Feedback",
		blurb: "A measurement on a fixed scale, coloured by where it falls.",
	},
	{
		slug: "progress",
		name: "Progress",
		group: "Feedback",
		blurb: "A bar showing how far a task has got, or that it is under way.",
	},
	{
		slug: "spinner",
		name: "Spinner",
		group: "Feedback",
		blurb: "An animated loading indicator that stands in for an icon.",
	},
	{
		slug: "skeleton",
		name: "Skeleton",
		group: "Feedback",
		blurb: "A placeholder that shimmers or pulses while content loads.",
	},
	{
		slug: "empty-state",
		name: "EmptyState",
		group: "Feedback",
		blurb: "A placeholder for a list or screen with nothing in it, and the action that fills it.",
	},
	{
		slug: "bottom-sheet",
		name: "BottomSheet",
		group: "Overlays",
		blurb: "A sheet that rises from the bottom edge — snap points, keyboard, sticky footer, scrollables and steps.",
	},
	{
		slug: "toast",
		name: "Toast",
		group: "Overlays",
		blurb:
			"A brief message from anywhere — even outside React — stacked at the edge of the screen, swiped away or gone on its own.",
	},
	{
		slug: "dialog",
		name: "Dialog",
		group: "Overlays",
		blurb: "A centred card over a dimmed app that asks for a decision or a short input — confirm, alert dialog, form.",
	},
	{
		slug: "popover",
		name: "Popover",
		group: "Overlays",
		blurb: "A small panel anchored to its trigger — flips and shifts to stay on screen, with an arrow that follows.",
	},
	{
		slug: "tooltip",
		name: "Tooltip",
		group: "Overlays",
		blurb:
			"A short label on a long press — anchored to its control, gone on its own, never in the way of the next tap.",
	},
	{
		slug: "drawer",
		name: "Drawer",
		group: "Overlays",
		blurb: "A panel that slides in from an edge and swipes back to it — a menu, a filter panel, a notifications tray.",
	},
	{
		slug: "feedback",
		name: "Feedback",
		group: "Overlays",
		blurb: "A dialog for writing — the field in a recessed well, a send that waits, steps that ease between heights.",
	},
	{
		slug: "steps",
		name: "Steps",
		group: "Navigation",
		blurb: "A stepper for multi-step flows: completed, current and upcoming steps joined by a line.",
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
		slug: "surface",
		name: "Surface",
		group: "Layout",
		blurb: "A rounded container on the theme's fill ladder, stepping to the next fill as it nests.",
	},
	{
		slug: "card",
		name: "Card",
		group: "Layout",
		blurb: "A content surface with a header, a body and a footer, built on Surface.",
	},
	{
		slug: "splitter",
		name: "Splitter",
		group: "Layout",
		blurb: "Two or more panes divided by draggable, adjustable handles, sized in percent.",
	},
	{
		slug: "sketch",
		name: "Sketch",
		group: "Layout",
		blurb:
			"A finger-drawing surface with a pen, eight shapes, an eraser, colours, stroke width and undo, exported as SVG or PNG.",
	},
	{
		slug: "page-header",
		name: "PageHeader",
		group: "Layout",
		blurb: "The head of a profile or place screen: a cover, an overlapping avatar, a title block, actions and stats.",
	},
	{
		slug: "grid-item",
		name: "GridItem",
		group: "Layout",
		blurb: "A bento grid of whole-cell tiles with aligned edges, and the tile with title, value and background parts.",
	},
	{
		slug: "frame",
		name: "Frame",
		group: "Layout",
		blurb: "A titled shell around a card of divided rows, with sections and a footer.",
	},
	{
		slug: "direction",
		name: "Direction",
		group: "Layout",
		blurb: "Sets left-to-right or right-to-left for a subtree, and tells gesture maths which way is start.",
	},
	{
		slug: "carousel",
		name: "Carousel",
		group: "Layout",
		blurb: "Swipeable slides on one fractional position \u2014 peek, loop, vertical, coverflow, dots and arrows.",
	},
	{
		slug: "provider",
		name: "DelacourProvider",
		group: "Utilities",
		blurb: "Every provider an app needs at its root, in one component.",
	},
	{
		slug: "overlay",
		name: "Overlay",
		group: "Utilities",
		blurb: "The provider, portal, scrim and presence lifecycle every overlay is drawn with.",
	},
];

/** The components in a group, in declaration order. */
export function componentsInGroup(group: ComponentGroup): readonly ComponentEntry[] {
	return COMPONENTS.filter((component) => component.group === group);
}

/**
 * Components with no screen in the playground.
 *
 * `DelacourProvider` and the overlay foundation have nothing to render on
 * their own — every route in the playground already sits downstream of the
 * provider, and every overlay's gallery draws the foundation — so neither has a
 * route to deep-link into, and neither has a "Scan to preview" button. The same exception, for the same
 * reason, as `COMPONENTS_WITHOUT_DEMOS` in `apps/playground/src/demos/demos.test.ts`.
 */
export const COMPONENTS_WITHOUT_SCREENS: ReadonlySet<string> = new Set(["overlay", "provider"]);

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

/** A page directly inside a top-level docs folder — the shape every engine page has. */
const DOCS_ENGINE_PATH = /^([a-z0-9-]+)\/[a-z0-9-]+\.mdx$/;

/**
 * An engine's docs folder, and the playground route its demos are on.
 *
 * An engine's gallery sits inside the skinned component's folder —
 * `(components)/bottom-sheet/engine.tsx` — because `components.test.ts` holds
 * `(components)/` to the library's component list. So the route is two
 * segments, and it is not derivable from the folder name: charts' docs folder
 * is `charts` and its route would be `chart/engine`.
 *
 * The app cannot vouch for these from its demo registry, whose ids start
 * `bottom-sheet-engine/`, so `apps/playground/src/lib/deep-link.ts` names each
 * one too. `components.test.ts` fails when a route here is missing from there.
 */
export const ENGINE_PLAYGROUND_ROUTES: Readonly<Record<string, string>> = {
	"bottom-sheet": "bottom-sheet/engine",
};

/**
 * The playground route for a documentation page, or `null` if the page has none.
 *
 * A component page names its component's gallery; an engine page names the
 * engine's. `null` covers what the docs toolbar must not offer a QR for: any
 * other page, the components `index.mdx`, and a component with no screen in
 * the playground.
 */
export function playgroundSlugForDocsPath(path: string): string | null {
	const slug = componentSlugForDocsPath(path);
	if (slug !== null) return hasPlaygroundScreen(slug) ? slug : null;

	const engine = DOCS_ENGINE_PATH.exec(path)?.[1];
	return engine === undefined ? null : (ENGINE_PLAYGROUND_ROUTES[engine] ?? null);
}

/**
 * The component a documentation page is about, or `null` outside
 * `native/components` and for that folder's `index.mdx`.
 */
export function componentSlugForDocsPath(path: string): string | null {
	return DOCS_COMPONENT_PATH.exec(path)?.[1] ?? null;
}
