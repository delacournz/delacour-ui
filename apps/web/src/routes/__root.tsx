import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { siteFontLinks } from "@/lib/google-fonts";
import { HOUSE_BACKGROUND } from "@/lib/house-meta";
import { appDescription, appName, docsImageRoute, siteUrl } from "@/lib/shared";
import { OG_HEIGHT, OG_WIDTH } from "@/og/card";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: `${appName} — React Native components`,
			},
			{
				name: "description",
				content: appDescription,
			},
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: appName },
			{ property: "og:title", content: `${appName} — React Native components` },
			{ property: "og:description", content: appDescription },
			{ property: "og:url", content: siteUrl },
			// The 1200×630 card `/og/docs` renders — the mark, the site line, the house
			// dark page. A docs page overrides `og:image` with its own title in the
			// query, from `routes/docs/$.tsx`.
			{ property: "og:image", content: `${siteUrl}${docsImageRoute}` },
			{ property: "og:image:width", content: String(OG_WIDTH) },
			{ property: "og:image:height", content: String(OG_HEIGHT) },
			{ property: "og:image:alt", content: `${appName} — React Native components` },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: `${appName} — React Native components` },
			{ name: "twitter:description", content: appDescription },
			{ name: "twitter:image", content: `${siteUrl}${docsImageRoute}` },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			// The house faces, on every page. `/theme` appends the catalogue's
			// specimen sheet after these — see `src/lib/google-fonts.ts`.
			...siteFontLinks(),
			// `.ico` first for the browsers that take the first icon they
			// understand; the SVG wins wherever both are read, which is every
			// browser that can scale one.
			{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
			{ rel: "manifest", href: "/site.webmanifest" },
		],
	}),
	component: RootComponent,
});

/**
 * The address bar follows the page, not the icon: these are the two
 * `--color-fd-background` values `house.css` paints, as hex, picked by the OS
 * rather than by the in-page theme toggle. `house-meta.ts` is generated from
 * the same preset as the CSS, so the two cannot disagree. The manifest's own
 * `theme_color` is the same pair's dark value, because an installed app's
 * splash sits behind the icon, not behind the page.
 *
 * They are written here rather than in the route's `head.meta`, which dedupes
 * by `name` and would keep only whichever of the two came last.
 */
function ThemeColour() {
	return (
		<>
			<meta content={HOUSE_BACKGROUND.light} media="(prefers-color-scheme: light)" name="theme-color" />
			<meta content={HOUSE_BACKGROUND.dark} media="(prefers-color-scheme: dark)" name="theme-color" />
		</>
	);
}

/**
 * The direction contract this site was built to, as the first child of
 * `<body>`, so the build that produced it can be re-read from the shipped
 * HTML. React cannot emit a bare comment node, so it rides inside an inert
 * `<template>` — never rendered, never read by assistive technology, and
 * present in the SSR output where `grep` for the seed key finds it.
 *
 * THESIS: Delacour UI is the studio's own site continued into its component
 * library: one black ground, one amber, one reading column. It refuses the
 * wide grey docs hero with a glow behind it.
 * OWN-WORLD: black page, zinc-900 surfaces, zinc-800 hairlines, near-white
 * text, amber for every interactive and every marker; Outfit 600 tight
 * headings over Inter body, Geist Mono code; 8px corners, 1.8x cards, fully
 * round pills; a faint particle-dot field under everything.
 * STORY: a React Native developer recognises the studio, reads one column top
 * to bottom, sees real phone captures, copies one command, and tries it on
 * their phone.
 * FIRST VIEWPORT: floating pill nav; a single 36rem column; the mark, then the
 * headline in Outfit at 48/56, the lede in zinc-400, one amber pill CTA and
 * one ghost CTA, the install tabs as the single calm card; the phone capture
 * sits to the right only above 1024px.
 * FORM: pinned by the user to the studio site; seed 4a705b78 spent; code-led.
 * FINISH: unreviewed and undocumented is unfinished.
 */
const DIRECTION_CONTRACT = `<!--
impeccable direction contract · seed 4a705b78
THESIS: Delacour UI is the studio's own site continued into its component library: one black ground, one amber, one reading column. It refuses the wide grey docs hero with a glow behind it.
OWN-WORLD: black page, zinc-900 surfaces, zinc-800 hairlines, near-white text, amber for every interactive and every marker; Outfit 600 tight headings over Inter body, Geist Mono code; 8px corners, 1.8x cards, fully round pills; a faint particle-dot field under everything.
STORY: a React Native developer recognises the studio, reads one column top to bottom, sees real phone captures, copies one command, and tries it on their phone.
FIRST VIEWPORT: floating pill nav; a single 36rem column; the mark, then the headline (copy unchanged) in Outfit at 48/56, the lede in zinc-400, one amber pill CTA and one ghost CTA, the install tabs as the single calm card; the phone capture sits to the right only above 1024px.
FORM: pinned by the user to the studio site; seed 4a705b78 spent; code-led.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`;

function DirectionContract() {
	return <template dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} id="direction-contract" />;
}

/**
 * Dark by default. The studio site is dark first and the house palette was
 * composed dark first; light stays a real, working theme behind the toggle,
 * and a visitor's choice persists the way `next-themes` always has.
 */
function RootComponent() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<ThemeColour />
			</head>
			<body className="flex min-h-screen flex-col">
				<DirectionContract />
				<RootProvider theme={{ defaultTheme: "dark" }}>
					<Outlet />
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
