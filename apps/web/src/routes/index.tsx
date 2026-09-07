import { createFileRoute, Link } from "@tanstack/react-router";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement, ReactNode } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { InstallTabs } from "@/components/install";
import { DeviceBezel, ThemedPreview } from "@/components/preview";
import { COMPONENT_GROUPS, COMPONENTS, type ComponentEntry, componentsInGroup } from "@/lib/components";
import { baseOptions } from "@/lib/layout.shared";
import { isInstallable, NATIVE_APP } from "@/lib/native-app";
import { appDescription, appName, gitConfig } from "@/lib/shared";
import { type PreviewId, previews } from "@/previews/manifest";

export const Route = createFileRoute("/")({
	component: Home,
	head: () => ({
		meta: [{ title: `${appName} — React Native components` }, { name: "description", content: appDescription }],
	}),
});

const GITHUB_URL = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

/**
 * The hero device: a whole screen from the library, photographed on a
 * simulator — the honest version of the phone every component site draws.
 *
 * It is the one capture composed as a catalogue rather than as a screen with
 * something to say: a tab bar, a chart, a field, the selection controls, a
 * slider and a settings group, so the phone answers "what is in the box" in the
 * first second. The demo is `screen/showcase`, and it is sized to fit one
 * viewport exactly — see its own doc comment before adding to it.
 */
const HERO_DEVICE: PreviewId = "screen/showcase";

/**
 * The showcase. Each tile is a captured demo, chosen for how much of the
 * component it shows in one frame. `span` widens a tile whose capture is
 * landscape enough to need it.
 */
type ShowcaseTile = {
	readonly slug: string;
	readonly preview: PreviewId;
	readonly span?: "wide";
};

const SHOWCASE: readonly ShowcaseTile[] = [
	{ slug: "chart", preview: "chart/parts/dashboard", span: "wide" },
	{ slug: "button", preview: "button/variants" },
	{ slug: "switch", preview: "switch/tap-or-drag" },
	{ slug: "slider", preview: "slider/anatomy" },
	{ slug: "checkbox", preview: "checkbox/colours" },
	{ slug: "tabs", preview: "tabs/variants/every-variant" },
	{ slug: "input", preview: "input/variants/at-rest" },
	{ slug: "accordion", preview: "accordion/one-at-a-time", span: "wide" },
	{ slug: "badge", preview: "badge/variants-and-colours" },
	{ slug: "list-group", preview: "list-group/custom-suffix" },
	{ slug: "radio", preview: "radio/variants-and-states" },
	{ slug: "text", preview: "text/type-scale" },
	{ slug: "spinner", preview: "spinner/sizes" },
];

const WEB_THEME = `/* globals.css — your web app, as shadcn wrote it */
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

const NATIVE_THEME = `/* theme.css — the same tokens, in the shape Uniwind reads */
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

const NATIVE_USAGE = `import { Button } from "delacour-react-native-ui/button";
import { Text } from "delacour-react-native-ui/text";

<View className="bg-background p-4">
  <Text className="text-muted-foreground">Same names. Same palette.</Text>
  <Button variant="primary" onPress={save}>
    <Button.Label>Save</Button.Label>
  </Button>
</View>;`;

const FEATURES = [
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
];

function Hero(): ReactElement {
	const device = previews[HERO_DEVICE];

	return (
		<section className="relative overflow-hidden border-b border-fd-border">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_50%_at_50%_-10%,var(--color-fd-accent),transparent_70%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]"
			/>
			<div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
				<div>
					<Link
						to="/docs/$"
						params={{ _splat: "native/releases" }}
						className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-background/70 px-3 py-1 font-medium text-fd-muted-foreground text-xs backdrop-blur transition-colors hover:text-fd-foreground"
					>
						<DelacourIcon size={14} />
						delacour-react-native-ui · alpha
						<span aria-hidden>→</span>
					</Link>
					<h1 className="mt-5 max-w-2xl text-balance font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
						Build your React Native component library.
					</h1>
					<p className="mt-5 max-w-xl text-pretty text-fd-muted-foreground text-lg">
						Composable, accessible components with thoughtful defaults. Code you can customize, extend and make your own
						— for iOS and Android, painted from the same design tokens as your web app.
					</p>

					<div className="mt-8 flex flex-wrap items-center gap-3">
						<Link
							to="/docs/$"
							params={{ _splat: "native/getting-started" }}
							className="rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground text-sm transition-opacity hover:opacity-90"
						>
							Quick start
						</Link>
						<Link
							to="/docs/$"
							params={{ _splat: "native/components" }}
							className="rounded-lg border border-fd-border bg-fd-background px-5 py-2.5 font-medium text-sm transition-colors hover:bg-fd-accent"
						>
							Browse components
						</Link>
						<a
							href={GITHUB_URL}
							rel="noreferrer noopener"
							target="_blank"
							className="px-2 py-2.5 font-medium text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
						>
							GitHub →
						</a>
					</div>

					<div className="mt-10 max-w-lg">
						<InstallTabs commands={[{ verb: "dlx", packages: ["delacour@alpha init button switch slider"] }]} />
					</div>

					<TryOnYourPhone />
				</div>

				<div className="hidden justify-center lg:flex">
					<DeviceBezel className="rotate-[-2deg] transition-transform duration-500 hover:rotate-0">
						<ThemedPreview entry={device} className="block h-auto w-[300px] max-w-full" />
					</DeviceBezel>
				</div>
			</div>
		</section>
	);
}

/**
 * The playground app, on the reader's own phone.
 *
 * Reads the same constant the QR popover and the fallback page read, so the
 * landing page can never advertise a build the rest of the site does not. A
 * placeholder link renders nothing rather than a dead button.
 */
function TryOnYourPhone(): ReactElement | null {
	if (!isInstallable(NATIVE_APP.IOS_TESTFLIGHT_URL)) return null;

	return (
		<p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-fd-muted-foreground text-sm">
			<span>Or try every component on your phone —</span>
			<a
				className="inline-flex items-center gap-1 font-medium text-fd-foreground underline underline-offset-4"
				href={NATIVE_APP.IOS_TESTFLIGHT_URL}
				rel="noreferrer noopener"
				target="_blank"
			>
				join the iOS beta on TestFlight
				<span aria-hidden>→</span>
			</a>
		</p>
	);
}

function SectionHeading({
	eyebrow,
	title,
	children,
}: {
	eyebrow: string;
	title: string;
	children?: ReactNode;
}): ReactElement {
	return (
		<div className="max-w-2xl">
			<p className="font-medium text-fd-muted-foreground text-sm uppercase tracking-wide">{eyebrow}</p>
			<h2 className="mt-2 text-balance font-semibold text-3xl tracking-tight sm:text-4xl">{title}</h2>
			{children ? <p className="mt-4 text-fd-muted-foreground text-lg">{children}</p> : null}
		</div>
	);
}

function componentBySlug(slug: string): ComponentEntry {
	const entry = COMPONENTS.find((component) => component.slug === slug);
	if (!entry) throw new Error(`Showcase names a component that is not in COMPONENTS: "${slug}"`);
	return entry;
}

/**
 * Real components, photographed on a real device.
 *
 * Every tile is a capture from `bun run previews`, which is the only way to
 * show these on the web at all — the library compiles under Metro, so nothing
 * here is a react-native-web imitation. The switch tile is a clip; the rest
 * are stills.
 */
function Showcase(): ReactElement {
	return (
		<section className="mx-auto max-w-6xl px-6 py-20">
			<div className="flex flex-wrap items-end justify-between gap-6">
				<SectionHeading eyebrow="Components" title="What they look like.">
					Nineteen components, every one captured on an iPhone in both themes. Toggle the site's theme and the pictures
					follow.
				</SectionHeading>
				<Link
					to="/docs/$"
					params={{ _splat: "native/components" }}
					className="font-medium text-fd-foreground text-sm underline underline-offset-4"
				>
					See all components →
				</Link>
			</div>

			<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{SHOWCASE.map((tile) => (
					<ShowcaseCard key={tile.slug} tile={tile} />
				))}
			</div>
		</section>
	);
}

function ShowcaseCard({ tile }: { tile: ShowcaseTile }): ReactElement {
	const component = componentBySlug(tile.slug);
	const entry = previews[tile.preview];
	const span = tile.span === "wide" ? "sm:col-span-2" : "";

	return (
		<Link
			to="/docs/$"
			params={{ _splat: `native/components/${component.slug}` }}
			className={`group/preview flex flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-card transition-colors hover:border-fd-foreground/30 ${span}`}
		>
			<div className="flex h-56 items-center justify-center overflow-hidden bg-fd-background p-4">
				<ThemedPreview entry={entry} className="h-full w-full object-contain" />
			</div>
			<div className="flex items-start justify-between gap-3 border-fd-border border-t p-4">
				<div className="flex flex-col gap-1">
					<span className="font-medium text-sm">{component.name}</span>
					<span className="text-fd-muted-foreground text-xs leading-relaxed">{component.blurb}</span>
				</div>
				<span aria-hidden className="text-fd-muted-foreground transition-transform group-hover/preview:translate-x-0.5">
					→
				</span>
			</div>
		</Link>
	);
}

/**
 * The pitch that is specific to this library: the palette is shadcn's, name
 * for name, so a web team's theme is a copy away from being the mobile
 * theme too.
 */
function Tokens(): ReactElement {
	return (
		<section className="border-fd-border border-y bg-fd-card/40">
			<div className="mx-auto max-w-6xl px-6 py-20">
				<SectionHeading eyebrow="Design tokens" title="Your web theme is already your mobile theme.">
					The palette is shadcn's, in shadcn's shape. Every token your web app already defines —{" "}
					<code className="text-fd-foreground">--primary</code>,{" "}
					<code className="text-fd-foreground">--muted-foreground</code>,{" "}
					<code className="text-fd-foreground">--radius</code> — is the token these components paint from. Copy your{" "}
					<code className="text-fd-foreground">globals.css</code> across and the mobile app matches the website from day
					one: same colours, same corners, same light and dark, and styled composable components before you have written
					a single one.
				</SectionHeading>

				<div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
					<DynamicCodeBlock lang="css" code={WEB_THEME} />
					<div className="flex flex-col items-center gap-2 text-center lg:px-2">
						<code className="rounded-md border border-fd-border bg-fd-background px-2.5 py-1.5 text-xs">
							bunx delacour theme ./globals.css
						</code>
						<span aria-hidden className="text-2xl text-fd-muted-foreground lg:rotate-0">
							→
						</span>
					</div>
					<DynamicCodeBlock lang="css" code={NATIVE_THEME} />
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
					<DynamicCodeBlock lang="tsx" code={NATIVE_USAGE} />
					<ul className="grid gap-4 text-sm">
						<TokenPoint title="One command, one file">
							<code className="text-fd-foreground">delacour theme</code> takes a path, a URL or stdin — a hand-written
							theme, a <code className="text-fd-foreground">shadcn init</code> output or a{" "}
							<a
								className="underline underline-offset-4"
								href="https://tweakcn.com"
								rel="noreferrer noopener"
								target="_blank"
							>
								tweakcn
							</a>{" "}
							export — and writes the file this library reads.
						</TokenPoint>
						<TokenPoint title="Nothing translated">
							Components reference the semantic name — <code className="text-fd-foreground">bg-primary</code>,{" "}
							<code className="text-fd-foreground">text-muted-foreground</code> — never a raw colour and never a{" "}
							<code className="text-fd-foreground">dark:</code> prefix. The variable swap is the theme.
						</TokenPoint>
						<TokenPoint title="The rest is derived">
							The six tokens shadcn has no name for — <code className="text-fd-foreground">success</code>,{" "}
							<code className="text-fd-foreground">warning</code>, <code className="text-fd-foreground">info</code>,{" "}
							<code className="text-fd-foreground">elevated</code>, <code className="text-fd-foreground">tertiary</code>
							, <code className="text-fd-foreground">overlay</code> — are built from the ones it does, so your palette
							drags them along.
						</TokenPoint>
						<li className="pt-2">
							<Link
								to="/docs/$"
								params={{ _splat: "native/getting-started/theming" }}
								className="font-medium text-fd-foreground underline underline-offset-4"
							>
								Read about theming →
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}

function TokenPoint({ title, children }: { title: string; children: ReactNode }): ReactElement {
	return (
		<li className="rounded-xl border border-fd-border bg-fd-background p-4">
			<p className="font-medium">{title}</p>
			<p className="mt-1 text-fd-muted-foreground leading-relaxed">{children}</p>
		</li>
	);
}

function Features(): ReactElement {
	return (
		<section className="mx-auto max-w-6xl px-6 py-20">
			<SectionHeading eyebrow="Principles" title="Built the way you would build it yourself.">
				Uniwind for styling, Reanimated and the Gesture API for motion, Skia for charts. Every decision written down
				beside the code that makes it.
			</SectionHeading>
			<div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-2 lg:grid-cols-3">
				{FEATURES.map((feature) => (
					<div key={feature.title} className="bg-fd-background p-6">
						<h3 className="font-medium">{feature.title}</h3>
						<p className="mt-2 text-fd-muted-foreground text-sm leading-relaxed">{feature.body}</p>
					</div>
				))}
			</div>
		</section>
	);
}

/**
 * Two routes in: the CLI copies source into a repository you own, the package
 * is for a team that would rather take updates than own the files.
 */
function GetStarted(): ReactElement {
	return (
		<section className="border-fd-border border-t bg-fd-card/40">
			<div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2">
				<div>
					<SectionHeading eyebrow="Install" title="Own the source, or install the package." />
					<p className="mt-4 max-w-md text-fd-muted-foreground">
						The CLI writes each component's files into your project so you can change anything. The package is the same
						code, versioned, for a team that would rather take updates.
					</p>
				</div>
				<div className="flex flex-col gap-6">
					<div>
						<p className="mb-2 font-medium text-fd-muted-foreground text-sm">Copy a component's source in</p>
						<InstallTabs commands={[{ verb: "dlx", packages: ["delacour@alpha add button"] }]} />
					</div>
					<div>
						<p className="mb-2 font-medium text-fd-muted-foreground text-sm">Or install the package</p>
						<InstallTabs commands={[{ verb: "add", packages: ["delacour-react-native-ui@alpha"] }]} />
					</div>
				</div>
			</div>
		</section>
	);
}

function ComponentIndex(): ReactElement {
	return (
		<section className="mx-auto max-w-6xl px-6 py-20">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<SectionHeading eyebrow="Library" title={`${COMPONENTS.length} components, and counting.`} />
				<Link
					to="/docs/$"
					params={{ _splat: "native/components" }}
					className="font-medium text-fd-foreground text-sm underline underline-offset-4"
				>
					Open the index →
				</Link>
			</div>
			<div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
				{COMPONENT_GROUPS.map((group) => (
					<div key={group}>
						<p className="mb-3 font-medium text-fd-muted-foreground text-xs uppercase tracking-wide">{group}</p>
						<ul className="flex flex-col gap-1.5">
							{componentsInGroup(group).map((component) => (
								<li key={component.slug}>
									<Link
										to="/docs/$"
										params={{ _splat: `native/components/${component.slug}` }}
										className="text-sm transition-colors hover:text-fd-muted-foreground"
									>
										{component.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</section>
	);
}

function Footer(): ReactElement {
	return (
		<footer className="border-fd-border border-t">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-fd-muted-foreground text-sm">
				<span className="inline-flex items-center gap-2">
					<DelacourIcon size={16} />
					{appName} — React Native only. iOS and Android, Expo or bare.
				</span>
				<div className="flex gap-5">
					<a
						className="underline underline-offset-4 hover:text-fd-foreground"
						href={GITHUB_URL}
						rel="noreferrer noopener"
					>
						GitHub
					</a>
					<a
						className="underline underline-offset-4 hover:text-fd-foreground"
						href="/llms.txt"
						rel="noreferrer noopener"
					>
						llms.txt
					</a>
				</div>
			</div>
		</footer>
	);
}

function Home(): ReactElement {
	return (
		<HomeLayout {...baseOptions()}>
			<Hero />
			<Showcase />
			<Tokens />
			<Features />
			<GetStarted />
			<ComponentIndex />
			<Footer />
		</HomeLayout>
	);
}
