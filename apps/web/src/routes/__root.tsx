import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { type ReactElement, useEffect } from "react";
import { ConsentBanner } from "@/components/consent-banner";
import { TrackedSearchDialog } from "@/components/search-dialog";
import { ANALYTICS } from "@/lib/analytics/config";
import { gaBootstrap } from "@/lib/analytics/consent";
import { startPosthog } from "@/lib/analytics/posthog";
import { installClickTracking } from "@/lib/analytics/track";
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
 * THESIS: Delacour UI is a graphite instrument panel for a component library:
 * greyscale, hairline-ruled, set entirely in mono with Inter only for headings.
 * It refuses the coloured accent and the floating pill nav.
 * OWN-WORLD: white or #131313 page, alpha hairlines at 12% / 10% drawn at 65%,
 * foreground hover fills at 2-5%, a 1px inner highlight under a faint shadow on
 * every surface; JetBrains Mono for the whole UI, Inter 600 tight for headings,
 * 10px base radius, cards at 1.8x, controls h-8 / h-9; colour only for status
 * and charts.
 * STORY: a React Native developer reads a dense, calm index, sees real phone
 * captures, copies one command, and tries it on their phone.
 * FIRST VIEWPORT: a frosted h-14 bar with the tracked wordmark, a live
 * component and category counter and a search pill; a mono kicker, the headline
 * in Inter, the lede, one primary and one ghost control, the install tabs; the
 * phone capture sits to the right only above 1024px.
 * FORM: pinned by the user to the devl.dev design language, written from its
 * token values and density rather than its source.
 */
const DIRECTION_CONTRACT = `<!--
impeccable direction contract · seed 4a705b78
THESIS: Delacour UI is a graphite instrument panel for a component library: greyscale, hairline-ruled, set entirely in mono with Inter only for headings. It refuses the coloured accent and the floating pill nav.
OWN-WORLD: white or #131313 page, alpha hairlines at 12% / 10% drawn at 65%, foreground hover fills at 2-5%, a 1px inner highlight under a faint shadow on every surface; JetBrains Mono for the whole UI, Inter 600 tight for headings, 10px base radius, cards at 1.8x, controls h-8 / h-9; colour only for status and charts.
STORY: a React Native developer reads a dense, calm index, sees real phone captures, copies one command, and tries it on their phone.
FIRST VIEWPORT: a frosted h-14 bar with the tracked wordmark, a live component and category counter and a search pill; a mono kicker, the headline (copy unchanged) in Inter, the lede, one primary and one ghost control, the install tabs; the phone capture sits to the right only above 1024px.
FORM: pinned by the user to the devl.dev design language, written from its token values and density rather than its source.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict and DESIGN.md.
CITED ADAPTATIONS: every colour on the site is resolveTokens(HOUSE_CONFIG), so the page ground is the graphite base's own value rather than a hand-picked one; the showcase grid and the component index fill the page container because they are a picture wall and an index, not prose, and each keeps its heading on the container's left edge; the committed previews were shot on the previous house, so --color-capture stays on that preset until they are recaptured.
-->`;

/**
 * The analytics tags, and nothing at all on a build without the env vars — see
 * `src/lib/analytics/config.ts`.
 *
 * GA's bootstrap sets Consent Mode's defaults before GA is configured; the
 * order of the statements inside it is the whole point of it.
 */
function AnalyticsTags(): ReactElement | null {
	const { ga } = ANALYTICS;

	return ga.kind === "on" ? <script dangerouslySetInnerHTML={{ __html: gaBootstrap(ga.id) }} /> : null;
}

function DirectionContract() {
	return <template dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} id="direction-contract" />;
}

/**
 * Dark by default. The house palette is graphite and was composed dark first; light stays a real, working theme behind the toggle,
 * and a visitor's choice persists the way `next-themes` always has.
 *
 * Search is Fumadocs' own dialog rebuilt so the query can be counted — see
 * `search-dialog.tsx` — and one delegated listener counts outbound links,
 * downloads and code copies on every route. PostHog starts on mount, on the
 * client only; it has no tag in `<head>` — see `src/lib/analytics/posthog.ts`.
 */
function RootComponent() {
	useEffect(() => startPosthog(), []);
	useEffect(() => installClickTracking(), []);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<ThemeColour />
				<AnalyticsTags />
			</head>
			<body className="flex min-h-screen flex-col">
				<DirectionContract />
				<RootProvider search={{ SearchDialog: TrackedSearchDialog }} theme={{ defaultTheme: "dark" }}>
					<Outlet />
					<ConsentBanner />
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
