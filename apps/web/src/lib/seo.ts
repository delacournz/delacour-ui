import {
	appDescription,
	appName,
	docsImageRoute,
	docsRoute,
	encodeMarkdownUrl,
	gitConfig,
	homeTitle,
	siteUrl,
} from "./shared";

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
			"A headless bottom sheet engine for React Native. Snap points, dynamic sizing, keyboard-aware sticky footers, scrollables, a teleported portal, detached cards and a typed multi-step machine — every radius, colour and inset is a style you pass in. No tokens, no className, no styling library.",
		cardTitle: "Bottom sheets for React Native",
		cardLine: "Snap points, keyboard, footer, steps. No tokens, no className.",
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

/**
 * The social card for a docs page, absolute. The page is named by its slugs and
 * the route works out the rest — title, line and capture — so the URL cannot
 * ask for a card no page has. The docs root is the bare route, the library's
 * default card.
 */
export function docsImageUrl(slugs: readonly string[]): string {
	if (!slugs.length) return `${siteUrl}${docsImageRoute}`;

	const query = new URLSearchParams({ page: slugs.join("/") });
	return `${siteUrl}${docsImageRoute}?${query.toString()}`;
}

export type DocsPageSeo = { slugs: readonly string[]; title: string; description?: string };

/** A schema.org node, as TanStack Router's `script:ld+json` meta entry renders it. */
export type JsonLd = { "@context"?: "https://schema.org"; "@type": string; [key: string]: unknown };

export type HeadMeta =
	| { title: string }
	| { name: string; content: string }
	| { property: string; content: string }
	// `content?: undefined` gives the entry a key in common with a `<meta>`'s props, which
	// TanStack's head type needs to accept it; the router renders it as a `<script>`.
	| { "script:ld+json": JsonLd; content?: undefined };
export type HeadLink = { rel: string; href: string; type?: string };
export type Head = { meta: HeadMeta[]; links: HeadLink[] };

/** The publisher every JSON-LD node names. */
const PUBLISHER: JsonLd = { "@type": "Organization", name: "Delacour", url: "https://delacour.co.nz" };

/**
 * What a search result calls a docs page. The query people type is "react native
 * <thing> component" and "shadcn react native", so a component page leads with
 * React Native and the part's name, and every other library page carries
 * "for React Native" after the site's name — "Button — Delacour UI" told a
 * results page nothing it could match. An engine keeps its own name, which
 * already says what it is.
 */
function docsTitle(product: DocsProduct, slugs: readonly string[], title: string): string {
	const seo = PRODUCTS[product];
	if (product !== "ui") return `${title} — ${seo.name}`;
	const isComponent = slugs.length === 3 && slugs[0] === "native" && slugs[1] === "components";
	return isComponent ? `React Native ${title} component — ${seo.name}` : `${title} — ${seo.name} for React Native`;
}

/** The crumbs a docs page sits under, one per slug, named from the slug. */
function breadcrumbs(slugs: readonly string[], title: string): JsonLd {
	const crumbs = [{ name: "Docs", path: docsRoute }];
	slugs.forEach((slug, index) => {
		const path = `${docsRoute}/${slugs.slice(0, index + 1).join("/")}`;
		const last = index === slugs.length - 1;
		crumbs.push({ name: last ? title : slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()), path });
	});

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: crumbs.slice(1).map((crumb, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: crumb.name,
			item: `${siteUrl}${crumb.path}`,
		})),
	};
}

/**
 * Every tag a docs page owns, overriding the root route's site-wide set —
 * TanStack Router dedupes `head.meta` by `name` / `property` and keeps the
 * deepest route's.
 *
 * A product's landing page (`/docs/charts`, whose MDX title is "Overview") is
 * titled with the product's headline; an inner page is "Line — Delacour
 * Charts". The card is the page's own — see `og/page.ts`.
 */
export function docsHead({ slugs, title, description }: DocsPageSeo): Head {
	const product = docsProduct(slugs);
	const seo = PRODUCTS[product];
	const url = `${siteUrl}${docsRoute}${slugs.length ? `/${slugs.join("/")}` : ""}`;
	const isLanding = product !== "ui" && url === `${siteUrl}${seo.path}`;
	const pageTitle = isLanding ? seo.headline : docsTitle(product, slugs, title);
	const body = description || seo.description;
	const image = docsImageUrl(slugs);

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
			{
				"script:ld+json": {
					"@context": "https://schema.org",
					"@type": "TechArticle",
					headline: pageTitle,
					description: body,
					url,
					image,
					inLanguage: "en",
					isPartOf: { "@type": "WebSite", name: appName, url: siteUrl },
					publisher: PUBLISHER,
				},
			},
			...(slugs.length ? [{ "script:ld+json": breadcrumbs(slugs, title) }] : []),
		],
		links: [
			{ rel: "canonical", href: url },
			// The page as Markdown, for an agent that reads `<link rel=alternate>` rather than `/llms.txt`.
			{ rel: "alternate", type: "text/markdown", href: `${siteUrl}${encodeMarkdownUrl([...slugs])}` },
		],
	};
}

export type MarketingPageSeo = { path: string; title: string; description: string };

/**
 * A page outside `/docs`: its title, description, `og:*` and a canonical with no
 * query string — `/theme?preset=…` is one page however many codes reach it.
 */
export function pageHead({ path, title, description }: MarketingPageSeo): Head {
	const url = `${siteUrl}${path}`;

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
		],
		links: [{ rel: "canonical", href: url }],
	};
}

/**
 * The landing page: `homeTitle`, the site description, and the two JSON-LD nodes
 * a search engine builds a sitelinks box and a software result from.
 */
export function homeHead(): Head {
	const { meta, links } = pageHead({ path: "/", title: homeTitle, description: appDescription });
	const repository = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

	return {
		meta: [
			...meta,
			{
				"script:ld+json": {
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: appName,
					url: `${siteUrl}/`,
					description: appDescription,
					publisher: PUBLISHER,
				},
			},
			{
				"script:ld+json": {
					"@context": "https://schema.org",
					"@type": "SoftwareSourceCode",
					name: `${appName} — shadcn/ui for React Native`,
					description: appDescription,
					url: `${siteUrl}/`,
					codeRepository: repository,
					programmingLanguage: ["TypeScript", "React Native"],
					runtimePlatform: ["iOS", "Android", "Expo"],
					license: "https://opensource.org/licenses/MIT",
					keywords: "shadcn, shadcn/ui, React Native, Expo, components, Uniwind, Tailwind, UI library",
					publisher: PUBLISHER,
				},
			},
		],
		links,
	};
}
