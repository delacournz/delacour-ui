/**
 * The only hand-written data in the registry.
 *
 * Everything else — which files belong to an item, what it depends on, how its
 * imports are rewritten — is derived from `packages/native-ui/src`, so it
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
 * Every package `native-ui` can import, and how to install it.
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
	// Ships a Fabric view, so it is version-matched and needs a rebuild too.
	"@legendapp/list": "expo",
	// Built on Reanimated and Gesture Handler, and pinned against both.
	"@gorhom/bottom-sheet": "expo",

	"@central-icons-react-native/round-outlined-radius-1-stroke-1.5": "npm",
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
	badge: {
		title: "Badge",
		description: "A compact label for status or a count, composed from parts like the button.",
		categories: ["display"],
	},
	"bottom-sheet": {
		title: "Bottom Sheet",
		description: "A draggable sheet over the screen, on @gorhom/bottom-sheet.",
		categories: ["overlays"],
	},
	button: {
		title: "Button",
		description: "A pressable action composed from parts, with variants, sizes and a loading state.",
		categories: ["controls"],
	},
	checkbox: {
		title: "Checkbox",
		description: "A checkbox with an indeterminate state, and a group that owns the selection.",
		categories: ["forms"],
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
	"list-group": {
		title: "List Group",
		description: "A surface grouping related rows, with dividers inserted automatically.",
		categories: ["layout"],
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
	radio: {
		title: "Radio",
		description: "A radio and the group that owns which one is selected.",
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

	expo: {
		title: "Navigation theme",
		description: "Hands expo-router's navigator this library's colours, including the slab behind a push.",
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
