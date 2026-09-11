import { describe, expect, test } from "bun:test";
import { COMPONENTS } from "@/lib/components";
import {
	COMPONENT_INDEX_COPY,
	FEATURES_COPY,
	FOOTER_COPY,
	GET_STARTED_COPY,
	HERO,
	NATIVE_THEME,
	NATIVE_USAGE,
	SHOWCASE_COPY,
	THEME_TEASER_COPY,
	TOKENS_COPY,
	WEB_THEME,
} from "./copy";

/**
 * The landing page's words, pinned.
 *
 * The redesign replaced every pixel of the page and was allowed to touch none
 * of the copy. This fixture is that copy as it stood before, so a rewrite of
 * the layout that quietly reworded a sentence fails here rather than shipping.
 * Change a sentence by changing both; that is the point.
 *
 * Two strings are derived rather than typed — the component counts — because
 * "Nineteen" was already wrong by the time the redesign started.
 */

describe("the hero", () => {
	test("says what it said", () => {
		expect(HERO).toEqual({
			badge: "delacour-react-native-ui · alpha",
			title: "Build your React Native component library.",
			lede: "Composable, accessible components with thoughtful defaults. Code you can customize, extend and make your own — for iOS and Android, painted from the same design tokens as your web app.",
			primary: "Quick start",
			secondary: "Browse components",
			github: "GitHub →",
			install: "delacour@alpha init button switch slider",
			phone: {
				lead: "Or try every component on your phone —",
				link: "join the iOS beta on TestFlight",
				soon: "the iOS beta on TestFlight is coming soon",
			},
		});
	});
});

describe("the sections", () => {
	test("showcase", () => {
		expect(SHOWCASE_COPY.eyebrow).toBe("Components");
		expect(SHOWCASE_COPY.title).toBe("What they look like.");
		expect(SHOWCASE_COPY.body(COMPONENTS.length)).toBe(
			`${COMPONENTS.length} components, every one captured on an iPhone in both themes. Toggle the site's theme and the pictures follow.`
		);
		expect(SHOWCASE_COPY.link).toBe("See all components →");
	});

	test("tokens", () => {
		expect(TOKENS_COPY).toEqual({
			eyebrow: "Design tokens",
			title: "Your web theme is already your mobile theme.",
			body: "The palette is shadcn's, in shadcn's shape. Every token your web app already defines — `--primary`, `--muted-foreground`, `--radius` — is the token these components paint from. Copy your `globals.css` across and the mobile app matches the website from day one: same colours, same corners, same light and dark, and styled composable components before you have written a single one.",
			command: "bunx delacour theme ./globals.css",
			points: [
				{
					title: "One command, one file",
					body: "`delacour theme` takes a path, a URL or stdin — a hand-written theme, a `shadcn init` output or a [tweakcn](https://tweakcn.com) export — and writes the file this library reads.",
				},
				{
					title: "Nothing translated",
					body: "Components reference the semantic name — `bg-primary`, `text-muted-foreground` — never a raw colour and never a `dark:` prefix. The variable swap is the theme.",
				},
				{
					title: "The rest is derived",
					body: "The six tokens shadcn has no name for — `success`, `warning`, `info`, `elevated`, `tertiary`, `overlay` — are built from the ones it does, so your palette drags them along.",
				},
			],
			link: "Read about theming →",
		});
	});

	test("the code samples are illustrations, and the same ones", () => {
		expect(WEB_THEME).toStartWith("/* globals.css — your web app, as shadcn wrote it */");
		expect(WEB_THEME).toContain("--muted-foreground: oklch(0.708 0 0);\n}");
		expect(NATIVE_THEME).toStartWith("/* theme.css — the same tokens, in the shape Uniwind reads */");
		expect(NATIVE_THEME).toContain("@variant dark {");
		expect(NATIVE_USAGE).toContain('<Text className="text-muted-foreground">Same names. Same palette.</Text>');
		expect(NATIVE_USAGE).toContain("<Button.Label>Save</Button.Label>");
	});

	test("principles", () => {
		expect(FEATURES_COPY.eyebrow).toBe("Principles");
		expect(FEATURES_COPY.title).toBe("Built the way you would build it yourself.");
		expect(FEATURES_COPY.body).toBe(
			"Uniwind for styling, Reanimated and the Gesture API for motion, Skia for charts. Every decision written down beside the code that makes it."
		);
		expect(FEATURES_COPY.items).toEqual([
			{
				title: "Composable",
				body: "Compound parts, not prop bags. A button takes a label and an icon as children, publishes its size and foreground to them, and a bare <Icon> comes out matching the text beside it.",
			},
			{
				title: "Accessible",
				body: "Roles, states and labels are wired into every control — a switch announces as a switch, a disabled button reads as disabled, and a separator is hidden from the screen reader that does not need it.",
			},
			{
				title: "Thoughtful defaults",
				body: "A loading spinner takes the place of the icon it replaces, so nothing shifts. Sizes index one scale. Corners derive from one radius. Every decision is written down beside the code that makes it.",
			},
			{
				title: "Yours to own",
				body: "The CLI copies the component's source into your repository. Change a variant, add one, delete what you do not need — it is your code from the first commit, not a dependency you configure around.",
			},
			{
				title: "Built for the platform",
				body: "Reanimated springs, the Gesture API, haptic feedback and Skia charts. A switch you can drag as well as tap. A sheet that follows the finger. Motion that belongs on a phone.",
			},
			{
				title: "Typed and tested",
				body: "Every variant resolver is pure TypeScript with no React Native import, so the whole matrix runs under bun test. Granular export subpaths keep the optional native modules genuinely optional.",
			},
		]);
	});

	test("install", () => {
		expect(GET_STARTED_COPY).toEqual({
			eyebrow: "Install",
			title: "Own the source, or install the package.",
			body: "The CLI writes each component's files into your project so you can change anything. The package is the same code, versioned, for a team that would rather take updates.",
			cli: { label: "Copy a component's source in", command: "delacour@alpha add button" },
			pkg: { label: "Or install the package", command: "delacour-react-native-ui@alpha" },
		});
	});

	test("library", () => {
		expect(COMPONENT_INDEX_COPY.eyebrow).toBe("Library");
		expect(COMPONENT_INDEX_COPY.title(COMPONENTS.length)).toBe(`${COMPONENTS.length} components, and counting.`);
		expect(COMPONENT_INDEX_COPY.link).toBe("Open the index →");
	});

	test("footer", () => {
		expect(FOOTER_COPY).toEqual({
			line: "Delacour UI — React Native only. iOS and Android, Expo or bare.",
			compare: "vs HeroUI",
			github: "GitHub",
			llms: "llms.txt",
		});
	});
});

/** The one section the redesign added. It has no fixture to match; it has to say something true. */
describe("the theme teaser", () => {
	test("names the customiser and links to it", () => {
		expect(THEME_TEASER_COPY.body).toContain("preset");
		expect(THEME_TEASER_COPY.link).toContain("customiser");
	});
});

/** British English, as PRODUCT.md binds it — outside the strings shadcn's own vocabulary fixes. */
test("the new copy spells colour and customiser the house way", () => {
	for (const text of [THEME_TEASER_COPY.body, THEME_TEASER_COPY.title, HERO.phone.soon]) {
		expect(text).not.toMatch(/\bcolor\b|customizer/);
	}
});
