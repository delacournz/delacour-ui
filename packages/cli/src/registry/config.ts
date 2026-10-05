/**
 * The only hand-written data in the registry.
 *
 * Everything else — which files belong to an item, what it depends on, how its
 * imports are rewritten — is derived from `packages/react-native-ui/src`, so it
 * cannot drift from the source. What is left is the part no static analysis can
 * recover: how a package should be installed, and what to call a component in a
 * list.
 */

/**
 * How a package reaches the consumer's project.
 *
 * - `ambient` — already in every Expo app; never installed.
 * - `expo` — routed through `expo install`, which resolves the version the
 *   installed SDK supports. `bun add react-native-reanimated` would pull the
 *   latest release, which for an older SDK is a build that does not compile.
 * - `npm` — plain JavaScript, installed with the project's package manager.
 * - `dev` — installed as a devDependency.
 */
export type PackageInstall = "ambient" | "expo" | "npm" | "dev";

/**
 * Every package `react-native-ui` can import, and how to install it.
 *
 * The builder throws on an import that is missing here, so a new dependency
 * cannot reach the registry without someone deciding which of these it is.
 */
export const PACKAGE_INSTALL: Record<string, PackageInstall> = {
	react: "ambient",
	"react-native": "ambient",

	// Native modules. Version-matched to the SDK, and each one needs a dev
	// client rebuild — two copies of a native module register twice and break.
	"react-native-gesture-handler": "expo",
	"react-native-pulsar": "expo",
	"react-native-reanimated": "expo",
	"react-native-safe-area-context": "expo",
	"react-native-screens": "expo",
	"react-native-svg": "expo",
	"react-native-worklets": "expo",
	"react-native-keyboard-controller": "expo",
	// Ships a Metro transformer, so it is bound to the toolchain the same way.
	uniwind: "expo",
	// Framework packages, resolved against the installed SDK like any other.
	"expo-router": "expo",
	// Ships a native gradient view, so it is version-matched and needs a rebuild.
	"expo-linear-gradient": "expo",
	// Ships a native blur view, so it is version-matched and needs a rebuild.
	"expo-blur": "expo",
	// Ships a Fabric view, so it is version-matched and needs a rebuild too.
	"@legendapp/list": "expo",
	// Ships a Fabric portal view, so it is version-matched and needs a rebuild.
	"react-native-teleport": "expo",
	// Ships a native 2D renderer, and Expo 57 bundles 2.6.2 — a bare `bun add`
	// would fetch the newest and fail at the linker rather than at install.
	"@shopify/react-native-skia": "expo",
	// Ships Apple and Google map views, and Expo 57 bundles 1.27.2. Only `map`
	// imports it, so an app without a map never installs it.
	"react-native-maps": "expo",

	"@central-icons-react-native/round-outlined-radius-1-stroke-1.5": "npm",
	// Plain TypeScript — the marks, the scales and the layout. Its own peers are
	// what need the SDK, and `ITEM_META.chart.dependencies` names them.
	"@delacour/react-native-charts": "npm",
	// Plain TypeScript over Reanimated, Gesture Handler, keyboard-controller and
	// teleport. Its own peers are what need the SDK, and
	// `ITEM_META["bottom-sheet"].dependencies` names them.
	"@delacour/react-native-bottom-sheet": "npm",
	clsx: "npm",
	tailwindcss: "npm",
	"tailwind-merge": "npm",
	"tailwind-variants": "npm",
};

export type ItemMeta = {
	title: string;
	description: string;
	categories?: string[];
	/**
	 * Packages an import scan cannot see — a CSS `@import`, or a peer a file
	 * relies on without naming. Classified through `PACKAGE_INSTALL` like any
	 * other.
	 */
	dependencies?: string[];
	/**
	 * Registry items an import scan cannot see — one the documented usage pairs
	 * with this item although no file imports it. Added to the derived edges.
	 */
	registryDependencies?: string[];
};

export const ITEM_META: Record<string, ItemMeta> = {
	accordion: {
		title: "Accordion",
		description: "Collapsible sections whose panels animate to their measured height.",
		categories: ["display"],
	},
	alert: {
		title: "Alert",
		description: "A status message with a glyph picked from its status, a title, a description and an optional action.",
		categories: ["feedback"],
	},
	"animated-badge": {
		title: "AnimatedBadge",
		description: "A status pill that rolls its content and springs its width when the status changes.",
		categories: ["feedback"],
	},
	attachment: {
		title: "Attachment",
		description: "A file, image or recording chip with a thumbnail, size, upload progress and remove control.",
		categories: ["media"],
	},
	avatar: {
		title: "Avatar",
		description: "A person as a picture, with an initials fallback, a corner badge and an overlapping group.",
		categories: ["display"],
	},
	badge: {
		title: "Badge",
		description: "A compact label for status or a count, composed from parts like the button.",
		categories: ["display"],
	},
	"bottom-sheet": {
		title: "Bottom Sheet",
		description:
			"A draggable sheet over the screen: snap points, keyboard, sticky footer, scrollables, steps and a teleported portal, on @delacour/react-native-bottom-sheet.",
		categories: ["overlays"],
		// `@delacour/react-native-bottom-sheet` peer-depends on teleport,
		// keyboard-controller, safe-area-context, Gesture Handler, Reanimated and
		// Worklets, and the skin's files import only some of them — so no scan can
		// see the rest. Teleport in particular is a native module: installed with
		// the package manager rather than `expo install` it is a build that fails
		// at the linker, and it needs a dev-client rebuild either way.
		dependencies: [
			"react-native-teleport",
			"react-native-keyboard-controller",
			"react-native-safe-area-context",
			"react-native-gesture-handler",
			"react-native-reanimated",
			"react-native-worklets",
		],
	},
	breadcrumb: {
		title: "Breadcrumb",
		description:
			"The path to the current screen: links back up each level, the current page last, with automatic separators, a collapsing middle or a scrolling trail.",
		categories: ["navigation"],
	},
	button: {
		title: "Button",
		description: "A pressable action composed from parts, with variants, sizes and a loading state.",
		categories: ["controls"],
	},
	calendar: {
		title: "Calendar",
		description:
			"A month grid for picking a day, several days or a range, with swipe paging and month and year jump views.",
		categories: ["forms"],
	},
	card: {
		title: "Card",
		description: "A content surface with a header, a body and a footer, built on Surface.",
		categories: ["layout"],
	},
	carousel: {
		title: "Carousel",
		description:
			"Swipeable slides on one fractional position, with peek, loop, vertical and coverflow layouts, dots and arrows.",
		categories: ["layout"],
	},
	checkbox: {
		title: "Checkbox",
		description: "A checkbox with an indeterminate state, and a group that owns the selection.",
		categories: ["forms"],
	},
	chip: {
		title: "Chip",
		description: "An interactive pill: a filter that toggles, a tag, or a token with a remove control.",
		categories: ["controls"],
	},
	chart: {
		title: "Chart",
		description:
			"Skia charts on the theme's series ramp: line, area, bar, scatter, candlestick and pie, with grid, axes, legend and tooltip.",
		categories: ["display"],
		// `@delacour/react-native-charts` peer-depends on Skia and Gesture Handler, and no
		// file here imports either — so no scan can see them. Installing them with the
		// package manager rather than `expo install` is a build that fails at the linker.
		// Reanimated and Worklets are named too, so the list stays whole if a file
		// here stops importing them.
		dependencies: [
			"@shopify/react-native-skia",
			"react-native-gesture-handler",
			"react-native-reanimated",
			"react-native-worklets",
		],
	},
	"color-picker": {
		title: "Color Picker",
		description:
			"A colour picked by dragging a saturation and brightness area and a hue track, with optional opacity, a hex field and swatches, inline or in a bottom sheet.",
		categories: ["forms"],
	},
	"circular-text": {
		title: "Circular Text",
		description: "Text set around a circle on an SVG path, optionally turning, with content in the middle.",
		categories: ["media"],
	},
	collapsible: {
		title: "Collapsible",
		description: "One section shown and hidden by its own trigger, animated to its measured height.",
		categories: ["display"],
	},
	dialog: {
		title: "Dialog",
		description:
			"A centred card over a dimmed app that asks for a decision or a short input: confirm, alert dialog, form, with keyboard lift and focus handling.",
		categories: ["overlays"],
		dependencies: ["react-native-teleport"],
	},
	drawer: {
		title: "Drawer",
		description:
			"A panel that slides in from an edge and covers the app until dismissed: a navigation menu, a filter panel, a notifications tray, with swipe-to-dismiss and RTL-aware sides.",
		categories: ["overlays"],
		dependencies: ["react-native-teleport"],
	},
	"context-menu": {
		title: "Context Menu",
		description:
			"The actions that belong to a piece of content, reached by holding it — Menu's rows over a scrim, with a lifted preview.",
		categories: ["controls"],
	},
	"date-picker": {
		title: "Date Picker",
		description:
			"An Input-shaped trigger that opens a Calendar in a bottom sheet for a day, a range or several days, closing when the pick is finished.",
		categories: ["forms"],
	},
	"date-time-picker": {
		title: "Date Time Picker",
		description:
			"An Input-shaped trigger that opens a Calendar and a time wheel in one bottom sheet — tabs or stacked, filled in either order, bounded by one date-time window.",
		categories: ["forms"],
	},
	combobox: {
		title: "Combobox",
		description:
			"A long or remote list behind a field-shaped trigger, filtered as you type in a bottom sheet — chips, server results, custom values.",
		categories: ["forms"],
	},
	direction: {
		title: "Direction",
		description: "Sets LTR or RTL for a subtree and exposes the sign for gesture maths.",
		categories: ["layout"],
	},
	countdown: {
		title: "Countdown",
		description:
			"Time left until a fixed moment, read from the wall clock every tick — sliding segmented digits or an inline run.",
		categories: ["display"],
	},
	"empty-state": {
		title: "Empty State",
		description: "A placeholder for a list or screen with nothing in it: media, title, description and actions.",
		categories: ["feedback"],
	},
	feedback: {
		title: "Feedback",
		description:
			"A dialog for writing: the field in a recessed well, a send that waits on a promise, a draft kept across close, and steps that ease between heights.",
		categories: ["overlays"],
	},
	fab: {
		title: "Fab",
		description: "A floating action button, extended with a label or unfolding a dial of related actions.",
		categories: ["controls"],
	},
	field: {
		title: "Field",
		description: "One control with its label, description and error — and the state they all read.",
		categories: ["forms"],
	},
	frame: {
		title: "Frame",
		description: "A titled shell around a card of divided rows, with sections and a footer.",
		categories: ["layout"],
	},
	"grid-item": {
		title: "Grid Item",
		description:
			"A bento grid of whole-cell tiles with aligned edges, and the tile with title, value and background parts.",
		categories: ["layout"],
	},
	icon: {
		title: "Icon",
		description: "A Central Icons glyph that inherits size and colour from the surrounding component.",
		categories: ["display"],
	},
	"image-viewer": {
		title: "Image Viewer",
		description:
			"A fullscreen viewer that opens from a thumbnail: pinch, pan and double-tap zoom, swipe between images, drag down to dismiss.",
		categories: ["display"],
	},
	input: {
		title: "Input",
		description:
			"A text field, with a group that puts prefixes, suffixes, buttons and full-width blocks inside its border.",
		categories: ["forms"],
	},
	item: {
		title: "Item",
		description: "A row of media, text and actions for lists and settings, standalone or as a List Group row.",
		categories: ["layout"],
	},
	flow: {
		title: "Flow",
		description:
			"A pan-and-zoom canvas of nodes joined by self-routing edges, with groups, handle-to-handle connections, controls and a minimap — the app owns the graph.",
		categories: ["display"],
	},
	kpi: {
		title: "Kpi",
		description:
			"One number, its change coloured by what it means, and a sparkline of how it got there, built on Card.",
		categories: ["display"],
	},
	label: {
		title: "Label",
		description: "A form control's name, with required, invalid and disabled states.",
		categories: ["forms"],
	},
	leaderboard: {
		title: "Leaderboard",
		description:
			"Ranked people or teams with ties, the top three on a podium of growing bars or lifted cards, and the highlighted entry pinned below the cut.",
		categories: ["display"],
	},
	"list-group": {
		title: "List Group",
		description: "A surface grouping related rows, with dividers inserted automatically.",
		categories: ["layout"],
	},
	overlay: {
		title: "Overlay",
		description:
			"The provider, teleported portal, scrim, presence lifecycle and back-button handling every dialog, drawer, popover, tooltip and toast is drawn with.",
		categories: ["overlays"],
		dependencies: ["react-native-teleport", "react-native-reanimated", "react-native-worklets"],
	},
	popover: {
		title: "Popover",
		description:
			"A small panel anchored to its trigger that flips and shifts to stay on screen, with an arrow, a title, a close control and an optional scrim.",
		categories: ["overlays"],
	},
	"number-input": {
		title: "Number Input",
		description: "A number between a minus and a plus: tap to step, hold to repeat, or type and commit on blur.",
		categories: ["forms"],
	},
	"otp-input": {
		title: "OTP Input",
		description: "A one-time code or PIN: cells drawn over one hidden field, with autofill and paste.",
		categories: ["forms"],
	},
	"page-header": {
		title: "Page Header",
		description:
			"A cover, an overlapping avatar, a title block, actions and stats — the head of a profile or place screen.",
		categories: ["layout"],
	},
	map: {
		title: "Map",
		description:
			"A themed map on react-native-maps: markers, pins, labels, popups, routes, arcs and controls, with a camera ref.",
		categories: ["display"],
	},
	message: {
		title: "Message",
		description: "A chat bubble with direction, run-aware corners, delivery status, reactions and an avatar gutter.",
		categories: ["media"],
	},
	"message-scroller": {
		title: "Message Scroller",
		description:
			"A bottom-anchored conversation list: sticks to the newest message, jumps to latest with an unread count, loads older history, rises with the keyboard.",
		categories: ["media"],
	},
	pressable: {
		title: "Pressable",
		description: "The Gesture API press primitive: scale and fade feedback, haptics, disabled and busy states.",
		categories: ["primitives"],
	},
	provider: {
		title: "Provider",
		description: "The root provider: safe-area insets seeded from the launch snapshot, and gesture handling.",
		categories: ["primitives"],
	},
	menu: {
		title: "Menu",
		description:
			"A list of actions anchored to the control that opens it — checkbox and radio rows, in-place submenus.",
		categories: ["controls"],
	},
	"markdown-editor": {
		title: "Markdown Editor",
		description: "A Markdown field with a formatting toolbar, a monospaced write pane and a rendered preview.",
		categories: ["forms"],
	},
	marker: {
		title: "Marker",
		description: "A centred inline note for a step or a day break between conversation turns, static or pressable.",
		categories: ["feedback"],
	},
	meter: {
		title: "Meter",
		description: "A measurement on a fixed scale, coloured by where it falls — by regions, thresholds or whole blocks.",
		categories: ["feedback"],
	},
	pagination: {
		title: "Pagination",
		description:
			"Moves through pages of a result set: a fixed-width run of numbers and gaps, a compact readout, or labelled arrows.",
		categories: ["navigation"],
	},
	planner: {
		title: "Planner",
		description:
			"A month of days, each showing what falls on it — category dots, icons, tiles or named blocks — with swipe paging, a week scroller and a sheet of the selected day.",
		categories: ["display"],
	},
	progress: {
		title: "Progress",
		description: "A bar showing how far a task has got, or a looping segment while it is under way.",
		categories: ["feedback"],
	},
	"progress-button": {
		title: "Progress Button",
		description:
			"A button held to confirm: a fill grows while it is held and the action fires when it reaches the end.",
		categories: ["controls"],
	},
	questionnaire: {
		title: "Questionnaire",
		description:
			"A guided form, one question at a time: single and multiple choice, text, rating, scale and yes/no, with branching, skips, validation and progress.",
		categories: ["forms"],
	},
	radio: {
		title: "Radio",
		description: "A radio and the group that owns which one is selected.",
		categories: ["forms"],
	},
	rating: {
		title: "Rating",
		description: "A row of stars that reads or sets a score, by tap or by drag, in whole or half steps.",
		categories: ["forms"],
	},
	select: {
		title: "Select",
		description:
			"A closed set of choices behind a field-shaped trigger, picked from a bottom sheet — single or multiple, grouped, searchable.",
		categories: ["forms"],
	},
	signature: {
		title: "Signature",
		description: "A pad to sign with a finger, with undo, redo and clear, handing back the strokes as JSON or SVG.",
		categories: ["forms"],
	},
	screen: {
		title: "Screen",
		description: "A screen frame: pinned chrome, a content region, and whatever scrolls between them.",
		categories: ["layout"],
	},
	"selection-mode": {
		title: "Selection Mode",
		description:
			"Pick several things at once — a long press enters the mode — then act on them from a bar, in a list, a grid or a strip.",
		categories: ["controls"],
	},
	"search-bar": {
		title: "Search Bar",
		description: "The query field at the top of a list: clear, Cancel, debounced reporting and filter tokens.",
		categories: ["forms"],
	},
	"section-progress": {
		title: "SectionProgress",
		description:
			"A floating pill over a long reading screen: a ring filling with scroll progress and the section being read, opening a list of sections to jump to.",
		categories: ["navigation"],
	},
	"section-rail": {
		title: "SectionRail",
		description:
			"A thin rail of bars along a screen edge, one per section, that opens into a labelled outline to jump or scrub through.",
		categories: ["navigation"],
		registryDependencies: ["use-scroll-sections"],
	},
	"scroll-fade": {
		title: "ScrollFade",
		description: "A gradient at a scrollable's edges while content runs past them, on any axis.",
		categories: ["layout"],
	},
	"scroll-canvas": {
		title: "ScrollCanvas",
		description:
			"An image in a still frame that parallaxes, zooms, reveals or scrubs a frame sequence as the page scrolls.",
		categories: ["layout"],
	},
	separator: {
		title: "Separator",
		description: "A one-pixel rule, hidden from assistive technology.",
		categories: ["layout"],
	},
	skeleton: {
		title: "Skeleton",
		description: "A placeholder that shimmers or pulses while content loads, in step across a group.",
		categories: ["feedback"],
	},
	"slide-button": {
		title: "Slide Button",
		description: "A handle dragged across a rail to confirm an action a tap should not reach.",
		categories: ["controls"],
	},
	sketch: {
		title: "Sketch",
		description:
			"A finger-drawing surface with a pen, eight shapes, an eraser, colours, stroke width and undo, exported as SVG.",
		categories: ["layout"],
	},
	slider: {
		title: "Slider",
		description: "A value along a track, dragged by a handle that follows the gesture.",
		categories: ["forms"],
	},
	sortable: {
		title: "Sortable",
		description:
			"A vertical list reordered by dragging a handle or a long-pressed row, on the UI thread, with pinned rows, auto-scroll and screen-reader move actions.",
		categories: ["navigation"],
	},
	spinner: {
		title: "Spinner",
		description: "An animated loading indicator drawn on the icon scale.",
		categories: ["feedback"],
	},
	"stack-card": {
		title: "Stack Card",
		description: "A deck taken one card at a time by throwing the top one off, with stamps, undo and a decline.",
		categories: ["controls"],
	},
	"split-view": {
		title: "SplitView",
		description: "Two stacked panes with a grip that settles on named heights.",
		categories: ["layout"],
	},
	splitter: {
		title: "Splitter",
		description: "Two or more panes divided by draggable handles, sized in percent.",
		categories: ["layout"],
	},
	steps: {
		title: "Steps",
		description: "A stepper for multi-step flows: completed, current and upcoming steps joined by a line.",
		categories: ["navigation"],
	},
	support: {
		title: "Support",
		description:
			"A help section: availability, channels, topics, past requests and the furniture around a support thread.",
		categories: ["media"],
	},
	surface: {
		title: "Surface",
		description: "A rounded container on the theme's fill ladder, stepping to the next fill as it nests.",
		categories: ["layout"],
	},
	swipe: {
		title: "Swipe",
		description:
			"A row that slides aside to reveal actions behind it, with a full swipe and a group that keeps one open.",
		categories: ["controls"],
	},
	switch: {
		title: "Switch",
		description: "An on/off control whose thumb can be dragged as well as tapped.",
		categories: ["forms"],
	},
	table: {
		title: "Table",
		description:
			"Rows and columns of short values lined up by one set of column rules, with sortable heads, selectable rows, a horizontal scroll for wide tables and a card frame.",
		categories: ["display"],
	},
	tabs: {
		title: "Tabs",
		description: "A swipeable pager with an indicator measured against the active tab.",
		categories: ["navigation"],
	},
	text: {
		title: "Text",
		description: "Typography: the type scale, weights and the page-level colours.",
		categories: ["display"],
	},
	"tag-input": {
		title: "Tag Input",
		description: "Free-form tags typed into one field box, each a removable chip, with validation and a max.",
		categories: ["forms"],
	},
	textarea: {
		title: "Textarea",
		description: "A multiline text field sized in rows, with auto-grow and a character count.",
		categories: ["forms"],
	},
	"time-picker": {
		title: "Time Picker",
		description:
			"A time of day on snapping wheels — hour, minute, optional second and AM/PM — in a bottom sheet or inline.",
		categories: ["forms"],
	},
	"theme-selector": {
		title: "Theme Selector",
		description:
			"System, Light or Dark, read from the live Uniwind theme and applied to it, with no storage dependency.",
		categories: ["controls"],
	},
	"scroll-blur": {
		title: "Scroll Blur",
		description: "A progressive blur at a scrollable's edges that falls back to a gradient fade.",
		categories: ["layout"],
	},
	"scroll-header": {
		title: "Scroll Header",
		description:
			"A large title that collapses into a pinned bar as the page scrolls, with a cover, a blur bar and snap.",
		categories: ["layout"],
	},
	timeline: {
		title: "Timeline",
		description:
			"Dated events down a rail or across a swipeable strip: progress fills the rail, tone tints the marker, and a list virtualises long histories.",
		categories: ["display"],
	},
	"toggle-button": {
		title: "Toggle Button",
		description: "A button that stays pressed, alone or in a group with single or multiple selection.",
		categories: ["controls"],
	},
	toast: {
		title: "Toast",
		description:
			"A brief message shown from anywhere, even outside React: stacked at an edge, swiped away, paused while touched, with a promise form and Alert's statuses.",
		categories: ["overlays"],
		dependencies: ["react-native-teleport"],
	},
	tooltip: {
		title: "Tooltip",
		description:
			"A short label on a long press, anchored to its control: hides itself, lets an outside tap through, and reads to a screen reader on the trigger.",
		categories: ["overlays"],
	},
	tour: {
		title: "Tour",
		description:
			"A guided walkthrough: the screen dims, a hole is cut around one control and a card beside it explains it, with Next, Back and Skip.",
		categories: ["navigation"],
	},
	tree: {
		title: "Tree",
		description:
			"A hierarchy opened one level at a time: branches that expand and collapse, with optional single or multiple selection.",
		categories: ["navigation"],
	},

	expo: {
		title: "Navigation theme",
		description: "Hands expo-router's navigator this library's colours, including the slab behind a push.",
	},

	"blur-layer": {
		title: "Expo blur layer",
		description: "expo-blur as ScrollBlur's engine — mount it once with ScrollBlurLayerProvider.",
	},

	"calm-motion": {
		title: "calmMotion",
		description: "Whether decorative loops hold still: reduce motion, or an app's E2E build asking.",
	},
	cn: { title: "cn", description: "Class merging that understands the library's semantic size tokens." },
	color: { title: "isLiteralColor", description: "Tells a literal colour from a theme token name." },
	"compose-refs": { title: "composeRefs", description: "Merges several refs onto one node." },
	"keyboard-animation": {
		title: "keyboardAnimation",
		description: "The timing the keyboard opens with, so content moving with it stays in step.",
	},
	"navigation-theme": {
		title: "navigationTheme",
		description: "Maps the theme's tokens onto the colours React Navigation asks for.",
	},
	"scroll-edges": {
		title: "scrollEdges",
		description: "Where an affordance at a scrollable's edges sits, and which way its gradient runs.",
	},
	"scroll-maths": {
		title: "scrollMaths",
		description: "The pure maths behind the scroll-linked components.",
	},
	"merge-props": { title: "mergeProps", description: "Merges slot props onto a child's own." },
	paging: {
		title: "paging",
		description: "Worklet-safe maths of paging through slides on one fractional position.",
	},
	"scroll-sections": {
		title: "scrollSections",
		description: "Which section a scroll offset is in, and how far down the content it is.",
	},
	slot: { title: "Slot", description: "Renders into a child element instead of a wrapper." },
	tv: { title: "tv", description: "tailwind-variants, taught the library's semantic size tokens." },

	"use-calm-motion": {
		title: "useCalmMotion",
		description: "Whether decorative loops hold still, and the provider an E2E build sets it from.",
	},
	"use-reduce-transparency": {
		title: "useReduceTransparency",
		description: "Whether iOS's Reduce Transparency is on, live, so a blur can swap for an opaque wash.",
	},
	"use-scroll-source": {
		title: "useScrollSource",
		description: "The scroll offset and sizes of a scrollable, on the UI thread, for effects that follow it.",
	},
	"use-scroll-sections": {
		title: "useScrollSections",
		description: "Tracks the section a scroll view is showing and its progress, on the UI thread.",
	},
	"use-keyboard-state-sync": {
		title: "useKeyboardStateSync",
		description: "Keeps the keyboard's height and progress on the UI thread, for layout that tracks it.",
	},
	"use-navigation-theme": {
		title: "useNavigationTheme",
		description: "Resolves the theme's colours for the active scheme, ready for a navigator.",
	},
	"use-controllable-state": {
		title: "useControllableState",
		description: "State that works controlled or uncontrolled from the same prop pair.",
	},
	"use-theme-color": {
		title: "useThemeColor",
		description: "Resolves a theme token to the colour the active scheme gives it.",
	},

	icons: {
		title: "Icons",
		description: "The Central Icons set, re-exported so components import glyphs from one place.",
	},
	styles: {
		title: "Styles",
		description: "Tailwind base, the semantic size tokens, and the light and dark theme palettes.",
		// base.css pulls both in through CSS, which no import scan can see.
		dependencies: ["tailwindcss", "uniwind"],
	},
};
