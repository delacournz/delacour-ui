import { appDescription, appName, docsImageRoute, docsRoute, siteUrl } from "./shared";

/**
 * The three things the docs site documents, and what a search result or a link
 * preview calls each.
 *
 * `@delacour/react-native-charts` and `@delacour/react-native-bottom-sheet` are
 * their own packages — Skia, Reanimated, Gesture Handler and keyboard-controller,
 * with no Tailwind, no Uniwind and no tokens — so their pages must not preview
 * as the component library's "painted from your shadcn web app". Everything
 * under `/docs/charts` is `charts`, everything under `/docs/bottom-sheet` is
 * `bottom-sheet`; everything else is `ui`.
 *
 * The slug a product's tree lives under is the product's own name, which is
 * what lets `docsProduct` and the `/og/docs` route parse it with one guard
 * rather than a literal per product.
 */
export type DocsProduct = "ui" | "charts" | "bottom-sheet";

export type ProductSeo = {
	/** `og:site_name`, the name on the card, and the suffix on an inner page's title. */
	name: string;
	/** The `<title>` and `og:title` of the product's landing page. */
	headline: string;
	/** The meta description for any page of the product that has none of its own. */
	description: string;
	/** The big line on a card with no page title. */
	cardTitle: string;
	/** The one line under the card's title. */
	cardLine: string;
	/** The product's docs root, relative to `siteUrl`. */
	path: string;
};

export const PRODUCTS: Record<DocsProduct, ProductSeo> = {
	ui: {
		name: appName,
		headline: `${appName} — React Native components`,
		description: appDescription,
		cardTitle: "Own your React Native UI",
		cardLine: "Composable, accessible, painted from your web theme.",
		path: docsRoute,
	},
	charts: {
		name: "Delacour Charts",
		headline: "Delacour Charts — Skia charts for React Native",
		description:
			"Headless, animated charts for React Native, drawn with Skia. Line, area, bar, scatter, candlestick and pie — every colour, font and size is a value you pass in. No tokens, no className, no styling library.",
		cardTitle: "Skia charts for React Native",
		cardLine: "Headless. Animated. No tokens, no className.",
		path: `${docsRoute}/charts`,
	},
	"bottom-sheet": {
		name: "Delacour Bottom Sheet",
		headline: "Delacour Bottom Sheet — a headless sheet engine for React Native",
		description:
			"A headless bottom sheet engine for React Native. Detents, dynamic sizing, keyboard-aware sticky footers, scrollables, a teleported portal, detached cards and a typed multi-step machine — every radius, colour and inset is a style you pass in. No tokens, no className, no styling library.",
		cardTitle: "Bottom sheets for React Native",
		cardLine: "Detents, keyboard, footer, steps. No tokens, no className.",
		path: `${docsRoute}/bottom-sheet`,
	},
};

/** The products a docs tree can be namespaced under — every product but the library, whose pages are everything else. */
const NAMESPACED_PRODUCTS: readonly DocsProduct[] = (Object.keys(PRODUCTS) as DocsProduct[]).filter(
	(product) => product !== "ui"
);

/** Whether a string names a docs product. The guard both `docsProduct` and the `/og/docs` query parse through. */
export function isDocsProduct(value: string | null | undefined): value is DocsProduct {
	return value !== null && value !== undefined && Object.hasOwn(PRODUCTS, value);
}

export function docsProduct(slugs: readonly string[]): DocsProduct {
	const first = slugs[0];
	return isDocsProduct(first) && NAMESPACED_PRODUCTS.includes(first) ? first : "ui";
}

/** The social card for a docs page, absolute. `ui` and a missing title are the route's defaults, so they stay out of the query. */
export function docsImageUrl({ product, title }: { product: DocsProduct; title?: string }): string {
	const query = new URLSearchParams();
	if (product !== "ui") query.set("product", product);
	if (title) query.set("title", title);
	const search = query.toString();
	return `${siteUrl}${docsImageRoute}${search ? `?${search}` : ""}`;
}

export type DocsPageSeo = { slugs: readonly string[]; title: string; description?: string };

export type HeadMeta = { title: string } | { name: string; content: string } | { property: string; content: string };
export type HeadLink = { rel: string; href: string };

/**
 * Every tag a docs page owns, overriding the root route's site-wide set —
 * TanStack Router dedupes `head.meta` by `name` / `property` and keeps the
 * deepest route's.
 *
 * A product's landing page (`/docs/charts`, whose MDX title is "Overview") is
 * titled with the product's headline and gets the product's default card; an
 * inner page is "Line — Delacour Charts" and carries its own title on the card.
 */
export function docsHead({ slugs, title, description }: DocsPageSeo): { meta: HeadMeta[]; links: HeadLink[] } {
	const product = docsProduct(slugs);
	const seo = PRODUCTS[product];
	const url = `${siteUrl}${docsRoute}${slugs.length ? `/${slugs.join("/")}` : ""}`;
	const isLanding = product !== "ui" && url === `${siteUrl}${seo.path}`;
	const pageTitle = isLanding ? seo.headline : `${title} — ${seo.name}`;
	const body = description || seo.description;
	const image = docsImageUrl({ product, title: isLanding ? undefined : title });

	return {
		meta: [
			{ title: pageTitle },
			{ name: "description", content: body },
			{ property: "og:site_name", content: seo.name },
			{ property: "og:title", content: pageTitle },
			{ property: "og:description", content: body },
			{ property: "og:url", content: url },
			{ property: "og:image", content: image },
			{ property: "og:image:alt", content: pageTitle },
			{ name: "twitter:title", content: pageTitle },
			{ name: "twitter:description", content: body },
			{ name: "twitter:image", content: image },
		],
		links: [{ rel: "canonical", href: url }],
	};
}
