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
	// Ships a Fabric view, so it is version-matched and needs a rebuild too.
	"@legendapp/list": "expo",
	// Ships a Fabric portal view, so it is version-matched and needs a rebuild.
	"react-native-teleport": "expo",
	// Ships a native 2D renderer, and Expo 57 bundles 2.6.2 — a bare `bun add`
	// would fetch the newest and fail at the linker rather than at install.
	"@shopify/react-native-skia": "expo",

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
	field: {
		title: "Field",
		description: "One control with its label, description and error — and the state they all read.",
		categories: ["forms"],
	},
	icon: {
		title: "Icon",
		description: "A Central Icons glyph that inherits size and colour from the surrounding component.",
		categories: ["display"],
	},
	input: {
		title: "Input",
		description: "A text field, with a group that puts a prefix or suffix inside its border.",
		categories: ["forms"],
	},
	item: {
		title: "Item",
		description: "A row of media, text and actions for lists and settings, standalone or as a List Group row.",
		categories: ["layout"],
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
	meter: {
		title: "Meter",
		description: "A measurement on a fixed scale, coloured by where it falls — by regions, thresholds or whole blocks.",
		categories: ["feedback"],
	},
	progress: {
		title: "Progress",
		description: "A bar showing how far a task has got, or a looping segment while it is under way.",
		categories: ["feedback"],
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
	screen: {
		title: "Screen",
		description: "A screen frame: pinned chrome, a content region, and whatever scrolls between them.",
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
	slider: {
		title: "Slider",
		description: "A value along a track, dragged by a handle that follows the gesture.",
		categories: ["forms"],
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
	steps: {
		title: "Steps",
		description: "A stepper for multi-step flows: completed, current and upcoming steps joined by a line.",
		categories: ["navigation"],
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
	textarea: {
		title: "Textarea",
		description: "A multiline text field sized in rows, with auto-grow and a character count.",
		categories: ["forms"],
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

	expo: {
		title: "Navigation theme",
		description: "Hands expo-router's navigator this library's colours, including the slab behind a push.",
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
	"merge-props": { title: "mergeProps", description: "Merges slot props onto a child's own." },
	slot: { title: "Slot", description: "Renders into a child element instead of a wrapper." },
	tv: { title: "tv", description: "tailwind-variants, taught the library's semantic size tokens." },

	"use-calm-motion": {
		title: "useCalmMotion",
		description: "Whether decorative loops hold still, and the provider an E2E build sets it from.",
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
