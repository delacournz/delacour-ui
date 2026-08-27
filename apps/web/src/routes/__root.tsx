import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { appDescription, appName, siteUrl } from "@/lib/shared";
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
			// The icon, not a rendered card. A square image and `summary` are what
			// the scrapers expect together; claiming `summary_large_image` without
			// a 1200×630 card is what produces a stretched, cropped preview.
			{ property: "og:image", content: `${siteUrl}/icon-512.png` },
			{ property: "og:image:width", content: "512" },
			{ property: "og:image:height", content: "512" },
			{ property: "og:image:alt", content: `The ${appName} mark` },
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: `${appName} — React Native components` },
			{ name: "twitter:description", content: appDescription },
			{ name: "twitter:image", content: `${siteUrl}/icon-512.png` },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
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
 * `--color-fd-background` values, picked by the OS rather than by the in-page
 * theme toggle. The manifest's own `theme_color` is the brand card instead,
 * because an installed app's splash sits behind the icon, not behind the page.
 *
 * They are written here rather than in the route's `head.meta`, which dedupes
 * by `name` and would keep only whichever of the two came last.
 */
function ThemeColour() {
	return (
		<>
			<meta content="#ffffff" media="(prefers-color-scheme: light)" name="theme-color" />
			<meta content="#0a0a0a" media="(prefers-color-scheme: dark)" name="theme-color" />
		</>
	);
}

function RootComponent() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<ThemeColour />
			</head>
			<body className="flex flex-col min-h-screen">
				<RootProvider>
					<Outlet />
				</RootProvider>
				<Scripts />
			</body>
		</html>
	);
}
