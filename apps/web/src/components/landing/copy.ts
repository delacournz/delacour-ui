import { appName } from "@/lib/shared";

/**
 * Every word on the landing page, in one place.
 *
 * The redesign was allowed to change everything about the page except what it
 * says, so the copy lives apart from the layout and `copy.test.ts` holds it to
 * a fixture. A sentence can still be rewritten — by editing both — but it can
 * no longer drift while someone is moving a card.
 *
 * Inline code and links are written in a two-mark notation, `` `code` `` and
 * `[text](url)`, and `rich-text.tsx` renders them. Plain strings are what a
 * test can compare; JSX is not.
 */

export const HERO = {
	badge: "delacour-react-native-ui · alpha",
	title: "The Foundation for your Mobile Design System",
	lede: "Accessible, composable components with the hard decisions already made. The source lands in your repository, yours to reshape and extend — iOS and Android, painted from the same design tokens as your web app.",
	primary: "Quick start",
	secondary: "Browse components",
	github: "GitHub →",
	install: "delacour@alpha init button switch slider",
	phone: {
		lead: "Or try every component on your phone —",
		link: "join the iOS beta on TestFlight",
		soon: "the iOS beta on TestFlight is coming soon",
	},
} as const;

export const SHOWCASE_COPY = {
	eyebrow: "Components",
	title: "What they look like.",
	body: (count: number): string =>
		`${count} components, every one captured on an iPhone in both themes. Toggle the site's theme and the pictures follow.`,
	link: "See all components →",
} as const;

export const TOKENS_COPY = {
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
} as const;

export const WEB_THEME = `/* globals.css — your web app, as shadcn wrote it */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted-foreground: oklch(0.556 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted-foreground: oklch(0.708 0 0);
}`;

export const NATIVE_THEME = `/* theme.css — the same tokens, in the shape Uniwind reads */
@layer theme {
  :root {
    @variant light {
      --background: oklch(1 0 0);
      --primary: oklch(0.205 0 0);
      --primary-foreground: oklch(0.985 0 0);
    }
    @variant dark {
      --background: oklch(0.145 0 0);
      --primary: oklch(0.922 0 0);
      --primary-foreground: oklch(0.205 0 0);
    }
  }
}`;

export const NATIVE_USAGE = `import { Button } from "delacour-react-native-ui/button";
import { Text } from "delacour-react-native-ui/text";

<View className="bg-background p-4">
  <Text className="text-muted-foreground">Same names. Same palette.</Text>
  <Button variant="primary" onPress={save}>
    <Button.Label>Save</Button.Label>
  </Button>
</View>;`;

export const FEATURES_COPY = {
	eyebrow: "Principles",
	title: "Built the way you would build it yourself.",
	body: "Uniwind for styling, Reanimated and the Gesture API for motion, Skia for charts. Every decision written down beside the code that makes it.",
	items: [
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
	],
} as const;

export const THEME_TEASER_COPY = {
	eyebrow: "Theme",
	title: "This site is wearing one of them.",
	body: "Every colour, corner and face on this page is a preset from the customiser — the same one that writes your app's theme.css. Try another, or build your own.",
	link: "Open the customiser →",
} as const;

export const GET_STARTED_COPY = {
	eyebrow: "Install",
	title: "Own the source, or install the package.",
	body: "The CLI writes each component's files into your project so you can change anything. The package is the same code, versioned, for a team that would rather take updates.",
	cli: { label: "Copy a component's source in", command: "delacour@alpha add button" },
	pkg: { label: "Or install the package", command: "delacour-react-native-ui@alpha" },
} as const;

export const COMPONENT_INDEX_COPY = {
	eyebrow: "Library",
	title: (count: number): string => `${count} components, and counting.`,
	link: "Open the index →",
} as const;

export const FOOTER_COPY = {
	line: `${appName} — React Native only. iOS and Android, Expo or bare.`,
	github: "GitHub",
	llms: "llms.txt",
} as const;
