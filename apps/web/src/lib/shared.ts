export const appName = "Delacour UI";

/** One sentence, served as the meta description and as both social cards' body. */
export const appDescription =
	"shadcn/ui for React Native: accessible, composable components for Expo, copied into your app by a CLI and themed from your shadcn web app's tokens.";

/**
 * The landing page's `<title>` and every site-wide `og:title`. It names the query
 * people search — "shadcn components for react native" — rather than only the
 * brand, which nobody types yet.
 */
export const homeTitle = `${appName} — shadcn/ui components for React Native`;

/**
 * The production origin, for the absolute URLs Open Graph and Twitter cards
 * require — a relative `og:image` is dropped by every scraper that reads it.
 * Staging serves the same tags; a preview crawl resolving to production art is
 * the right trade against threading a per-environment origin through SSR.
 */
export const siteUrl = "https://ui.delacour.co.nz";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
/** The privacy policy. The playground links here, and `privacy-url.test.ts` there holds the two together. */
export const privacyRoute = "/privacy";

export const gitConfig = {
	user: "delacournz",
	repo: "delacour-ui",
	branch: "main",
};

export function encodeMarkdownUrl(slugs: string[], locale?: string) {
	const segments = [...slugs];
	if (segments.length === 0) {
		segments.push("index.md");
	} else {
		segments[segments.length - 1] += ".md";
	}

	return `/${[locale, ...docsRoute.split("/"), ...segments].filter(Boolean).join("/")}`;
}

/** @returns page slugs */
export function decodeMarkdownUrl(segments: string[]) {
	if (segments.length === 0) return [];

	const out = [...segments];
	out[out.length - 1] = out[out.length - 1].replace(/\.md$/, "");
	if (out.length === 1 && out[0] === "index") out.pop();
	return out;
}

/**
 * Does this href point at a file the server hands back whole, rather than at a
 * page the router renders?
 *
 * `/llms.txt`, `/llms-full.txt` and every docs page's `.md` twin are route
 * handlers with no component. The client router still matches their paths, so a
 * `<Link>` to one navigates, finds nothing to render and shows the 404 page —
 * while the same URL typed into the address bar serves correctly. Such an href
 * has to reach the browser as a plain anchor, which is a document request.
 *
 * The rule is the file extension on the last segment: no docs URL carries one.
 * External hrefs are excluded because fumadocs' own `Link` already gives those
 * a plain anchor.
 */
export function isFileHref(href: string) {
	if (!href.startsWith("/") || href.startsWith("//")) return false;
	const path = href.split(/[?#]/)[0];
	return path.slice(path.lastIndexOf("/") + 1).includes(".");
}
