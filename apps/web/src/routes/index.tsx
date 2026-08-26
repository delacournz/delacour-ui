import { createFileRoute, Link } from "@tanstack/react-router";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { COMPONENTS } from "@/lib/components";
import { baseOptions } from "@/lib/layout.shared";
import { appName, gitConfig } from "@/lib/shared";

export const Route = createFileRoute("/")({
	component: Home,
	head: () => ({
		meta: [
			{ title: `${appName} — React Native components` },
			{
				name: "description",
				content:
					"A React Native component library built on Uniwind, Reanimated and the Gesture API. Compose, don't configure.",
			},
		],
	}),
});

const FEATURES = [
	{
		title: "Compose, don't configure",
		body: "Icons are children, never props. A button publishes its size and its variant's foreground to the subtree, so a bare <Icon> comes out matching the label beside it.",
	},
	{
		title: "Loading that costs no layout",
		body: "The spinner takes the place of the icon it replaces rather than joining it. Both are drawn at the same token, so nothing shifts when work begins — or when it ends.",
	},
	{
		title: "One scale, indexed",
		body: "Icon and Spinner resolve md to the same edge length. A checkbox's square reads that scale two steps up rather than minting its own three numbers.",
	},
	{
		title: "Themed by CSS variables",
		body: "Components name bg-background and text-muted-foreground — never a raw palette colour, never a dark: prefix. Swap the variables and the theme follows.",
	},
	{
		title: "Decisions you can unit-test",
		body: "Every pure resolver lives in a *.variants.ts free of React Native imports, so the whole variant matrix is reachable from bun test rather than only from a simulator.",
	},
	{
		title: "Peers, not dependencies",
		body: "Every native module is a peer, and granular export subpaths make the optional ones genuinely optional. Import /button and nothing keyboard-related resolves.",
	},
];

const EXAMPLE = `import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight } from "@delacour/native-ui/icons/central";

<Button haptic="selection" onPress={next}>
  <Button.Label>Continue</Button.Label>
  <Icon icon={IconArrowRight} />
</Button>;`;

function Hero() {
	return (
		<section className="relative overflow-hidden border-b border-fd-border">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_50%_0%,var(--color-fd-accent),transparent_70%)] opacity-60"
			/>
			<div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
				<p className="text-sm font-medium text-fd-muted-foreground">Delacour UI · Native</p>
				<h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
					React Native components that compose.
				</h1>
				<p className="mt-5 max-w-2xl text-lg text-fd-muted-foreground">
					Built on Uniwind, Reanimated and the Gesture API. Nineteen components, 148 typed surfaces, and a reason
					written down for every decision.
				</p>

				<div className="mt-8 flex flex-wrap items-center gap-3">
					<Link
						to="/docs/$"
						params={{ _splat: "native/getting-started" }}
						className="rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
					>
						Get started
					</Link>
					<Link
						to="/docs/$"
						params={{ _splat: "native/components" }}
						className="rounded-lg border border-fd-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
					>
						Browse components
					</Link>
					<a
						href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
						rel="noreferrer noopener"
						target="_blank"
						className="rounded-lg px-4 py-2.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
					>
						GitHub →
					</a>
				</div>

				<div className="mt-10 max-w-md">
					<DynamicCodeBlock lang="bash" code="bun add @delacour/native-ui" />
				</div>
			</div>
		</section>
	);
}

function Example() {
	return (
		<section className="mx-auto max-w-5xl px-6 py-16">
			<div className="grid gap-10 lg:grid-cols-2 lg:items-center">
				<div>
					<h2 className="text-2xl font-semibold tracking-tight">The icon names nothing</h2>
					<p className="mt-3 text-fd-muted-foreground">
						No <code className="text-fd-foreground">size</code>, no <code className="text-fd-foreground">color</code>.
						The button wraps its subtree in an icon-defaults provider carrying its own size class and its variant's
						foreground token, so a bare glyph comes out right with nothing said at the call site.
					</p>
					<p className="mt-3 text-fd-muted-foreground">
						Set either explicitly and yours wins. That is the whole precedence rule, and it is the same one every
						component here follows.
					</p>
					<Link
						to="/docs/$"
						params={{ _splat: "native/getting-started/composition" }}
						className="mt-5 inline-block text-sm font-medium text-fd-foreground underline underline-offset-4"
					>
						How composition works
					</Link>
				</div>
				<DynamicCodeBlock lang="tsx" code={EXAMPLE} />
			</div>
		</section>
	);
}

function Features() {
	return (
		<section className="border-t border-fd-border bg-fd-card/40">
			<div className="mx-auto max-w-5xl px-6 py-16">
				<h2 className="text-2xl font-semibold tracking-tight">Why it is built this way</h2>
				<div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature) => (
						<div key={feature.title} className="bg-fd-background p-6">
							<h3 className="font-medium">{feature.title}</h3>
							<p className="mt-2 text-sm text-fd-muted-foreground">{feature.body}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function ComponentStrip() {
	return (
		<section className="border-t border-fd-border">
			<div className="mx-auto max-w-5xl px-6 py-16">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<h2 className="text-2xl font-semibold tracking-tight">Nineteen components</h2>
					<Link
						to="/docs/$"
						params={{ _splat: "native/components" }}
						className="text-sm font-medium text-fd-muted-foreground underline underline-offset-4 hover:text-fd-foreground"
					>
						See them all
					</Link>
				</div>
				<div className="mt-6 flex flex-wrap gap-2">
					{COMPONENTS.map((component) => (
						<Link
							key={component.slug}
							to="/docs/$"
							params={{ _splat: `native/components/${component.slug}` }}
							className="rounded-full border border-fd-border px-3.5 py-1.5 text-sm transition-colors hover:bg-fd-accent"
						>
							{component.name}
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="border-t border-fd-border">
			<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-fd-muted-foreground">
				<span>{appName} — React Native only. iOS and Android, Expo or bare.</span>
				<a className="underline underline-offset-4 hover:text-fd-foreground" href="/llms.txt" rel="noreferrer noopener">
					llms.txt
				</a>
			</div>
		</footer>
	);
}

function Home() {
	return (
		<HomeLayout {...baseOptions()}>
			<Hero />
			<Example />
			<Features />
			<ComponentStrip />
			<Footer />
		</HomeLayout>
	);
}
