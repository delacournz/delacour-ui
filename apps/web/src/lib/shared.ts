export const appName = "Delacour UI";

/** One sentence, served as the meta description and as both social cards' body. */
export const appDescription =
	"A React Native component library built on Uniwind, Reanimated and the Gesture API. Compose, don't configure.";

/**
 * The production origin, for the absolute URLs Open Graph and Twitter cards
 * require — a relative `og:image` is dropped by every scraper that reads it.
 * Staging serves the same tags; a preview crawl resolving to production art is
 * the right trade against threading a per-environment origin through SSR.
 */
export const siteUrl = "https://ui.delacour.co.nz";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";

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
