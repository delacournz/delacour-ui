import { COMPONENTS } from "../components";
import type { Comparison } from "./types";

const DOCS = "https://ui.ahmedbna.com/docs";

/**
 * BNA UI, read from its docs and README on 2026-11-04. It shares the shadcn
 * copy-in model but not the styling layer: it styles with `StyleSheet`, by
 * choice, where this library styles with Tailwind classes.
 */
export const BNA_UI: Comparison = {
	slug: "bna-ui",
	name: "BNA UI",
	tagline: "MIT · copied in by its own CLI",
	href: "https://ui.ahmedbna.com",
	title: "Delacour UI vs BNA UI: React Native component libraries",
	description:
		"Delacour UI and BNA UI compared: both copy React Native components into your Expo app. One styles with Tailwind and shadcn tokens, one with StyleSheet.",
	summary:
		"Both copy components into an Expo app. BNA UI styles with StyleSheet and ships media components; Delacour UI styles with Tailwind and shadcn's tokens.",
	eyebrow: "Delacour UI vs BNA UI",
	headline: "Same delivery, different styling layer.",
	lede: "Both libraries are shadcn-inspired and copy each component's source into your app through a CLI, with an MCP server and Markdown docs for agents. BNA UI styles with StyleSheet objects and a colours file of its own, and ships camera, audio and video components plus backend starters. Delacour UI styles with Tailwind classes painted from shadcn's CSS variables, so a web app's theme carries straight across.",
	sections: [
		{
			id: "delivery",
			title: "How the code arrives",
			blurb: "Both copy the source in. Only one also ships as a package.",
			rows: [
				{
					feature: "Component source in your repository",
					delacour: { support: "yes", note: "delacour add button" },
					them: { support: "yes", note: "npx bna-ui add button" },
				},
				{
					feature: "Also installable as one npm package",
					delacour: { support: "yes", note: "@delacour/react-native-ui, one subpath per component" },
					them: { support: "no", note: "fetched from ui.ahmedbna.com/r by the CLI" },
				},
				{
					feature: "Starter apps with a backend wired in",
					delacour: { support: "no", note: "delacour init sets up an app you already have" },
					them: { support: "yes", note: "init, convex, supabase and firebase starters" },
				},
				{
					feature: "Bare React Native, without Expo",
					delacour: { support: "yes", note: "Expo or the React Native CLI" },
					them: { support: "partial", note: "installation covers Expo apps only" },
				},
			],
		},
		{
			id: "styling",
			title: "Styling and theming",
			blurb: "The real difference. One is Tailwind on shadcn's tokens; the other is StyleSheet on its own.",
			rows: [
				{
					feature: "Tailwind className",
					delacour: { support: "yes", note: "Tailwind v4, compiled by Uniwind" },
					them: { support: "no", note: "StyleSheet and the style prop, never className" },
				},
				{
					feature: "No styling compiler in your Metro config",
					delacour: { support: "no", note: "Uniwind wraps Metro" },
					them: { support: "yes", note: "plain StyleSheet, nothing to configure" },
				},
				{
					feature: "shadcn's token names",
					delacour: { support: "yes", note: "--primary, --muted-foreground, --radius" },
					them: { support: "no", note: "its own theme/colors.ts, read with useColor" },
				},
				{
					feature: "Bring a web app's globals.css across",
					delacour: { support: "yes", note: "delacour theme takes a path, a URL or stdin" },
					them: { support: "no", note: "colours are re-typed into theme/colors.ts" },
				},
				{
					feature: "Light and dark",
					delacour: { support: "yes", note: "both, from one theme.css" },
					them: { support: "yes", note: "built-in light and dark mode" },
				},
			],
		},
		{
			id: "coverage",
			title: "What is in the box",
			blurb: "Similar breadth, aimed at different apps.",
			rows: [
				{
					feature: "Components",
					delacour: { support: "yes", note: `${COMPONENTS.length}, grouped from actions to overlays` },
					them: { support: "yes", note: "52, plus a separate chart set" },
				},
				{
					feature: "Charts, bottom sheet, toast, date picker",
					delacour: { support: "yes", note: "each one" },
					them: { support: "yes", note: "each one" },
				},
				{
					feature: "Camera, audio and video components",
					delacour: { support: "no", note: "not in the library" },
					them: { support: "yes", note: "camera, audio recorder and player, video" },
				},
				{
					feature: "Runs on the web as well",
					delacour: { support: "no", note: "iOS and Android only" },
					them: { support: "yes", note: "responsive web support" },
				},
			],
		},
		{
			id: "agents",
			title: "Coding agents",
			blurb: "Both are built for an agent to drive — the closest row on the page.",
			rows: [
				{
					feature: "An MCP server",
					delacour: { support: "yes", note: "npx delacour@latest mcp" },
					them: { support: "yes", note: "npx bna-ui mcp" },
				},
				{
					feature: "Every docs page as Markdown",
					delacour: { support: "yes", note: "/llms.txt and a .md twin per page" },
					them: { support: "yes", note: "/llms.txt and a .md twin per page" },
				},
				{
					feature: "An installable agent skill",
					delacour: { support: "yes", note: "npx delacour@latest skills" },
					them: { support: "yes", note: "a Claude skill" },
				},
			],
		},
	],
	choose: {
		them: "Choose BNA UI if you would rather not run a styling compiler, need camera, audio or video components, want a backend starter, or need the web.",
		us: "Choose Delacour UI if your team already writes Tailwind and shadcn/ui on the web and wants the native app on the same classes and the same theme.",
	},
	sources: [
		{ label: "CLI", href: `${DOCS}/cli` },
		{ label: "Installation", href: `${DOCS}/installation` },
		{ label: "Theming", href: `${DOCS}/theming` },
		{ label: "Components", href: `${DOCS}/components` },
		{ label: "LLMs", href: `${DOCS}/llms` },
		{ label: "README", href: "https://github.com/ahmedbna/ui" },
	],
	checked: "2026-11-04",
};
