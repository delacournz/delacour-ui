import { COMPONENTS } from "../components";
import type { Comparison } from "./types";

const DOCS = "https://github.com/founded-labs/react-native-reusables/blob/main/apps/docs/content/docs";

/**
 * React Native Reusables, read from its own docs source and README on
 * 2026-11-04. Its site renders client-side, so the MDX in the repository is
 * the citable copy. It is the closest thing to this library — the shadcn model
 * on React Native — so most rows are a tie, and the page says so.
 */
export const REACT_NATIVE_REUSABLES: Comparison = {
	slug: "react-native-reusables",
	name: "React Native Reusables",
	tagline: "MIT · copied in by the shadcn CLI",
	href: "https://reactnativereusables.com",
	title: "Delacour UI vs React Native Reusables: shadcn/ui for RN",
	description:
		"Two shadcn/ui ports for React Native, compared row by row: delivery, styling engine, theming, component coverage, web support and coding agents.",
	summary:
		"Both bring shadcn/ui to React Native. Reusables ports the core set onto Radix-style primitives; Delacour UI goes wider.",
	eyebrow: "Delacour UI vs React Native Reusables",
	headline: "Two answers to shadcn/ui for React Native.",
	lede: "Both libraries copy a component's source into your app and paint it from shadcn's CSS variables. React Native Reusables ports shadcn/ui's core set onto @rn-primitives, runs on the web too, and uses the shadcn CLI. Delacour UI is native only, Tailwind v4 through Uniwind, and covers far more ground — charts, sheets, toasts, date pickers — with an upgrade path for files you have edited.",
	sections: [
		{
			id: "delivery",
			title: "How the code arrives",
			blurb:
				"Both are the shadcn model: the source lands in your repository and is yours to change. They differ in what happens after.",
			rows: [
				{
					feature: "Component source in your repository",
					delacour: { support: "yes", note: "delacour add button" },
					them: { support: "yes", note: "npx @react-native-reusables/cli add button" },
				},
				{
					feature: "Runs on the shadcn CLI",
					delacour: { support: "no", note: "its own CLI, delacour" },
					them: { support: "yes", note: "uses the shadcn CLI under the hood" },
				},
				{
					feature: "Also installable as one npm package",
					delacour: { support: "yes", note: "@delacour/react-native-ui, one subpath per component" },
					them: { support: "no", note: "copy only" },
				},
				{
					feature: "Upstream fixes merge into a file you edited",
					delacour: { support: "yes", note: "delacour update merges into your copy" },
					them: { support: "no", note: "add --overwrite replaces the file" },
				},
				{
					feature: "Scaffolds a new Expo app",
					delacour: { support: "no", note: "delacour init sets up an app you already have" },
					them: { support: "yes", note: "init, with minimal, minimal-uniwind and clerk-auth templates" },
				},
			],
		},
		{
			id: "styling",
			title: "Styling and theming",
			blurb: "Both speak shadcn's token names. They sit on different Tailwind generations.",
			rows: [
				{
					feature: "Tailwind className on native",
					delacour: { support: "yes", note: "Tailwind v4, compiled by Uniwind" },
					them: { support: "yes", note: "Tailwind v3 through NativeWind, or Uniwind" },
				},
				{
					feature: "Works with NativeWind",
					delacour: { support: "no", note: "Uniwind only — the two cannot share an app" },
					them: { support: "yes", note: "NativeWind or Uniwind, detected by the CLI" },
				},
				{
					feature: "shadcn's token names",
					delacour: { support: "yes", note: "--primary, --muted-foreground, --radius" },
					them: { support: "yes", note: "shadcn/ui's CSS variables in global.css" },
				},
				{
					feature: "Bring a web app's globals.css across",
					delacour: { support: "yes", note: "delacour theme takes a path, a URL or stdin" },
					them: {
						support: "partial",
						note: "paste a Tailwind v3 theme, rename .dark to .dark:root, mirror it in theme.ts",
					},
				},
				{
					feature: "A visual theme builder",
					delacour: { support: "yes", note: "/theme, on this site" },
					them: { support: "partial", note: "points to shadcn/ui's themes page" },
				},
			],
		},
		{
			id: "coverage",
			title: "What is in the box",
			blurb:
				"Reusables mirrors shadcn/ui's core primitives. Delacour UI carries those plus the mobile components an app reaches for next.",
			rows: [
				{
					feature: "Components",
					delacour: { support: "yes", note: `${COMPONENTS.length}, grouped from actions to overlays` },
					them: { support: "partial", note: "30, shadcn/ui's core set" },
				},
				{
					feature: "Charts, bottom sheet, toast, date picker, carousel",
					delacour: { support: "yes", note: "each one, on headless Skia and sheet engines" },
					them: { support: "no", note: "not in the component list" },
				},
				{
					feature: "Radix-style primitives underneath",
					delacour: { support: "no", note: "its own compound parts" },
					them: { support: "yes", note: "@rn-primitives, a port of Radix UI's API" },
				},
				{
					feature: "Runs on the web as well",
					delacour: { support: "no", note: "iOS and Android only" },
					them: { support: "yes", note: "universal apps, through react-native-web" },
				},
			],
		},
		{
			id: "agents",
			title: "Coding agents",
			blurb: "Both expect an agent to do the adding. They hand it different things.",
			rows: [
				{
					feature: "An MCP server for your project",
					delacour: { support: "yes", note: "npx delacour@latest mcp" },
					them: { support: "partial", note: "catalogs.dev, a separate Founded Labs product" },
				},
				{
					feature: "Every docs page as Markdown",
					delacour: { support: "yes", note: "/llms.txt, /llms-full.txt and a .md twin per page" },
					them: { support: "partial", note: "the docs are MDX in the public repository" },
				},
				{
					feature: "A track record",
					delacour: { support: "partial", note: "a young library, one maintainer" },
					them: { support: "yes", note: "8.7k GitHub stars, in Vercel's OSS programme" },
				},
			],
		},
	],
	choose: {
		them: "Choose React Native Reusables if you need the web from the same components, are staying on NativeWind, or want shadcn/ui's exact primitives and nothing more.",
		us: "Choose Delacour UI for a native app that needs more than the core set, a theme carried across from your web app in one command, and copies you can edit without losing upgrades.",
	},
	sources: [
		{ label: "Introduction", href: `${DOCS}/index.mdx` },
		{ label: "CLI", href: `${DOCS}/cli.mdx` },
		{ label: "Customization", href: `${DOCS}/customization.mdx` },
		{ label: "Components", href: `${DOCS}/components` },
		{ label: "catalogs.dev", href: `${DOCS}/catalogs.mdx` },
		{ label: "README", href: "https://github.com/founded-labs/react-native-reusables" },
	],
	checked: "2026-11-04",
};
