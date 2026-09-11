/**
 * The Delacour UI ↔ HeroUI comparison, as data.
 *
 * `/compare/heroui` renders this and nothing else, for the same reason
 * `COMPONENTS` exists: a claim written into JSX is a claim nobody can audit,
 * and a comparison page is the one page on this site where every line is a
 * statement about somebody else's product. Keeping it here means the whole set
 * can be read in one screen, sorted, counted, and held to a shape by
 * `comparison.test.ts` — every row answers for all three products, every claim
 * carries the note that says what it actually means, and nothing is a bare
 * tick.
 *
 * **Every claim here is sourced.** `SOURCES` carries the page each fact was
 * read from, and the page prints them. Prices are deliberately absent: HeroUI
 * publishes tier names and a licence model but not the amounts, and a number
 * this file guessed would be the one thing on the page that could be wrong in
 * a way a reader could not check. Check the sources before editing a row.
 */

/** How a product answers one row. */
export type Support = "yes" | "no" | "partial";

/** One product's answer: the verdict, and what it actually means. */
export type Answer = {
	readonly support: Support;
	/** A fragment, no trailing full stop — rendered under the mark. */
	readonly note: string;
};

/** The three columns, in the order the table draws them. */
export const PRODUCT_IDS = ["delacour", "heroui", "pro"] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

/** Keyed by `ProductId` so a row can be read by column without a lookup table. */
export type Row = { readonly feature: string } & { readonly [Id in ProductId]: Answer };

export type Section = {
	readonly id: string;
	readonly title: string;
	readonly blurb: string;
	readonly rows: readonly Row[];
};

export type Product = {
	readonly id: ProductId;
	readonly name: string;
	readonly tagline: string;
	readonly href: string;
};

export const PRODUCTS: readonly Product[] = [
	{
		id: "delacour",
		name: "Delacour UI",
		tagline: "MIT · copy in or install",
		href: "/docs/native/getting-started",
	},
	{
		id: "heroui",
		name: "HeroUI Native",
		tagline: "Apache-2.0 · npm package",
		href: "https://heroui.com",
	},
	{
		id: "pro",
		name: "HeroUI Pro",
		tagline: "Commercial · licensed package",
		href: "https://heroui.pro",
	},
];

/**
 * The point of the page, in one row per consequence.
 *
 * Ordered so the first three are the ones a reader came for: where the file
 * is, whether they can edit it, and what happens to that edit next time they
 * upgrade.
 */
const OWNERSHIP: Section = {
	id: "ownership",
	title: "Where the code lives",
	blurb:
		"This is the whole difference, and everything else on this page follows from it. Delacour UI's CLI writes a component's source into your repository, under your import alias, on your branch. Both HeroUI libraries resolve out of node_modules.",
	rows: [
		{
			feature: "Component source in your repository",
			delacour: { support: "yes", note: "delacour add button writes app/components/ui/button.tsx" },
			heroui: { support: "no", note: "node_modules/heroui-native" },
			pro: { support: "no", note: "node_modules/heroui-native-pro, fetched from a CDN" },
		},
		{
			feature: "Change a variant by editing the file",
			delacour: { support: "yes", note: "it is your file — open it and change it" },
			heroui: { support: "no", note: "wrap it, override classes, or fork the repository" },
			pro: { support: "no", note: "the terms forbid modifying components for redistribution" },
		},
		{
			feature: "Your edits survive an upgrade",
			delacour: { support: "yes", note: "delacour diff prints both sides and picks no winner" },
			heroui: { support: "no", note: "npm update replaces the package wholesale" },
			pro: { support: "no", note: "the CLI re-downloads the licensed build" },
		},
		{
			feature: "Add a component the library does not have",
			delacour: { support: "yes", note: "it is a folder beside the others, in your own style" },
			heroui: { support: "partial", note: "beside the library, not inside it — only the core team adds components" },
			pro: { support: "partial", note: "beside the library, not inside it" },
		},
		{
			feature: "Delete what you do not use",
			delacour: { support: "yes", note: "you only ever added the components you asked for" },
			heroui: { support: "partial", note: "subpath imports keep the rest out of the bundle, not out of the tree" },
			pro: { support: "partial", note: "subpath imports keep the rest out of the bundle, not out of the tree" },
		},
		{
			feature: "Installs with no account, no login, no token",
			delacour: { support: "yes", note: "a public registry and a public npm package" },
			heroui: { support: "yes", note: "npm install heroui-native" },
			pro: { support: "no", note: "heroui-pro login, and HEROUI_AUTH_TOKEN in CI" },
		},
		{
			feature: "You can publish the source you shipped",
			delacour: { support: "yes", note: "MIT — the copy in your repository is yours" },
			heroui: { support: "yes", note: "Apache-2.0" },
			pro: { support: "no", note: "sharing, publishing or sub-licensing the source is prohibited" },
		},
		{
			feature: "Priced per developer",
			delacour: { support: "no", note: "free, and there is no paid tier to graduate to" },
			heroui: { support: "no", note: "free" },
			pro: { support: "yes", note: "perpetual seats, one year of updates, renewals optional" },
		},
	],
};

/**
 * Deliberately the boring section. Both libraries reached for the same stack,
 * which is what makes the rest of the page a fair comparison rather than an
 * argument about styling engines.
 */
const STACK: Section = {
	id: "stack",
	title: "The stack is the same",
	blurb:
		"Both libraries style with Tailwind v4 through Uniwind, animate with Reanimated and read gestures through the Gesture API. Nothing above turns on one of them having picked better tools.",
	rows: [
		{
			feature: "Tailwind v4 className styling, via Uniwind",
			delacour: { support: "yes", note: "className on every component" },
			heroui: { support: "yes", note: "className on every component" },
			pro: { support: "yes", note: "className on every component" },
		},
		{
			feature: "Reanimated and the Gesture API",
			delacour: { support: "yes", note: "declared as peers, never dependencies" },
			heroui: { support: "yes", note: "declared as peers, with pinned ranges" },
			pro: { support: "yes", note: "peer detection is part of the install" },
		},
		{
			feature: "Granular subpath imports",
			delacour: { support: "yes", note: "delacour-react-native-ui/button — no package-wide barrel" },
			heroui: { support: "yes", note: "heroui-native/button" },
			pro: { support: "yes", note: "heroui-native-pro subpaths" },
		},
		{
			feature: "A provider at the root of the app",
			delacour: { support: "yes", note: "DelacourProvider" },
			heroui: { support: "yes", note: "HeroUINativeProvider" },
			pro: { support: "yes", note: "HeroUINativeProvider" },
		},
		{
			feature: "iOS and Android, Expo or bare",
			delacour: { support: "yes", note: "pinned to the versions Expo SDK 57 bundles" },
			heroui: { support: "yes", note: "peer ranges, checked by the install" },
			pro: { support: "yes", note: "peer ranges, checked by the install" },
		},
	],
};

/**
 * Theming is the second-order consequence of the first section: a theme you
 * can paste over is only useful if the file it lands in is yours.
 */
const THEMING: Section = {
	id: "theming",
	title: "Theming and design tokens",
	blurb:
		"Delacour UI paints from shadcn's palette, name for name, so the theme a web team already maintains is the mobile theme after one command. HeroUI ships its own token vocabulary and, on Pro, a hosted builder for it.",
	rows: [
		{
			feature: "Token names match shadcn's",
			delacour: { support: "yes", note: "--primary, --muted-foreground, --radius — every one of them" },
			heroui: { support: "no", note: "its own token vocabulary" },
			pro: { support: "no", note: "its own token vocabulary" },
		},
		{
			feature: "Bring a web app's globals.css across",
			delacour: { support: "yes", note: "delacour theme takes a path, a URL or stdin" },
			heroui: { support: "no", note: "no import path from a shadcn or tweakcn theme" },
			pro: { support: "no", note: "themes are authored in HeroUI's own dashboard" },
		},
		{
			feature: "A visual theme builder",
			delacour: { support: "yes", note: "/theme — server-rendered, every state a URL, no account" },
			heroui: { support: "no", note: "edit the theme by hand" },
			pro: { support: "yes", note: "a hosted dashboard, behind the licence" },
		},
		{
			feature: "The theme file is yours to hand-edit",
			delacour: { support: "yes", note: "theme.css sits in your repository from delacour init" },
			heroui: { support: "yes", note: "your own CSS overrides the package's" },
			pro: { support: "yes", note: "your own CSS overrides the package's" },
		},
	],
};

/**
 * Named plainly, and first-class rather than a footnote.
 *
 * A comparison page that concedes nothing is one an evaluator stops trusting
 * at the first row they already know the answer to — and the ownership
 * argument above is stronger, not weaker, once a reader can see it was not the
 * only thing measured.
 */
const AGAINST: Section = {
	id: "against",
	title: "Where HeroUI is ahead",
	blurb:
		"Three of these are structural and are not going to change: HeroUI covers the web, it is the work of a company rather than one maintainer, and Pro sells finished screens. If any of them is what you are buying, buy it.",
	rows: [
		{
			feature: "React components for the web",
			delacour: { support: "no", note: "React Native only — the web story is the shared palette" },
			heroui: { support: "yes", note: "the HeroUI React library, Apache-2.0" },
			pro: { support: "yes", note: "the Pro React library too" },
		},
		{
			feature: "One design system across web and native",
			delacour: { support: "partial", note: "the tokens cross over; the components do not" },
			heroui: { support: "yes", note: "a similar API on both" },
			pro: { support: "yes", note: "sold as one system in the Super Hero tier" },
		},
		{
			feature: "Prebuilt screens, blocks and templates",
			delacour: { support: "no", note: "components, and a playground that demonstrates them" },
			heroui: { support: "no", note: "components" },
			pro: { support: "yes", note: "templates and blocks are most of what the licence buys" },
		},
		{
			feature: "Maintained by a company, with paid support",
			delacour: { support: "no", note: "one maintainer, GitHub issues" },
			heroui: { support: "partial", note: "NextUI Inc., community support" },
			pro: { support: "yes", note: "private Discord and prioritised support" },
		},
		{
			feature: "Past its first stable release",
			delacour: { support: "no", note: "0.1.0-alpha — the API still moves" },
			heroui: { support: "yes", note: "1.x, with NextUI's history behind it" },
			pro: { support: "yes", note: "1.x" },
		},
		{
			feature: "A Figma design system behind the components",
			delacour: { support: "no", note: "the code is the design system" },
			heroui: { support: "yes", note: "the core team designs in Figma first" },
			pro: { support: "yes", note: "design system files ship with every tier" },
		},
	],
};

export const SECTIONS: readonly Section[] = [OWNERSHIP, STACK, THEMING, AGAINST];

/** The section a reader is sent to when they want the argument rather than the table. */
export const HEADLINE_SECTION = OWNERSHIP.id;

/**
 * The two code samples the page puts side by side, and the reason they live
 * here rather than in the route: they are content, and their **line length is
 * a layout constraint**. The block they render into is about half of a 1380px
 * page, and a `<pre>` that overflows it scrolls inside itself — so a line past
 * the limit is silently clipped mid-sentence on an ordinary desktop, on the
 * one section of the page that carries the argument. `comparison.test.ts`
 * pins the width; keep any edit under it, breaking a statement across lines
 * rather than letting one run.
 */
export const MAX_SAMPLE_LINE = 58;

export const CODE_SAMPLES = {
	/** Adding a variant to a library you installed. */
	wrapper: `// node_modules/heroui-native/button — not yours to edit.
// A new variant is a wrapper, and the type union
// never learns about it.

import { Button } from "heroui-native/button";
import type { ButtonProps } from "heroui-native/button";

export function BrandButton(props: ButtonProps) {
  const className = cn("bg-brand", props.className);
  return <Button {...props} className={className} />;
}

// Every call site says <BrandButton>, forever — and
// the next release can change Button's internals
// underneath this without telling you.`,

	/** Adding a variant to a file you own. */
	variant: `// app/components/ui/button.variants.ts — the file
// delacour add wrote. A new variant is a line in an
// object you own.

variant: {
  primary: {
    root: "bg-primary",
    label: "text-primary-foreground",
  },
  brand: {
    root: "bg-brand",
    label: "text-brand-foreground",
  },
},

// <Button variant="brand"> typechecks, because the
// union is derived from this object at build time.
// Nothing wraps anything.`,
} as const;

export type Source = {
	readonly label: string;
	readonly href: string;
};

/** Read before editing a row. Every claim above comes from one of these. */
export const SOURCES: readonly Source[] = [
	{ label: "HeroUI Native — Quick Start", href: "https://heroui.com/docs/native/getting-started/quick-start" },
	{ label: "heroui-inc/heroui-native — contributing and licence", href: "https://github.com/heroui-inc/heroui-native" },
	{ label: "HeroUI Pro — installation", href: "https://heroui.pro/docs/react/getting-started/installation" },
	{ label: "HeroUI Pro — licensing", href: "https://heroui.pro/docs/react/getting-started/licensing" },
	{ label: "HeroUI Pro — terms and conditions", href: "https://heroui.pro/terms" },
	{ label: "HeroUI Pro — pricing tiers", href: "https://heroui.pro/pricing" },
];

/**
 * Every word on `/compare/heroui`, in one place.
 *
 * The landing page's redesign moved its prose into `components/landing/copy.ts`
 * so a sentence could not drift while somebody was moving a card; this page
 * takes the same rule. It keeps its copy here rather than there because it is
 * not the landing page, and because these sentences are claims — they belong
 * beside the rows and the sources that back them.
 */
export const COMPARE_COPY = {
	description:
		"HeroUI ships React Native components as an npm package. Delacour UI copies the source into your repository, MIT, yours to edit — with the package available if you would rather take updates.",
	eyebrow: "Delacour UI vs HeroUI",
	title: "The difference is where the code lives.",
	lede: "HeroUI Native and HeroUI Pro are good libraries built on the same stack as this one — Tailwind v4 through Uniwind, Reanimated, the Gesture API. They install into node_modules. Delacour UI writes the component's source into your repository, under your import alias, on your branch — the shadcn model, for React Native. Everything below follows from that one difference.",
	primary: "Quick start",
	secondary: "Jump to the table",

	/** The two file paths, side by side — the whole argument as an address. */
	where: [
		{
			label: "HeroUI Native, and HeroUI Pro",
			path: "node_modules/heroui-native/lib/button",
			body: "Resolved from the registry, or downloaded from a CDN against a licence. Read-only in practice: you configure around it, wrap it, or fork the whole repository.",
			ours: false,
		},
		{
			label: "Delacour UI",
			path: "app/components/ui/button.tsx",
			body: "Written by delacour add, MIT, committed by you. Open it and change it. delacour diff will tell you what moved upstream and will never overwrite your work to do it.",
			ours: true,
		},
	],

	change: {
		eyebrow: "The main point",
		title: "Adding one variant, both ways.",
		body: "Not a contrived example — a brand colour on a button is the first thing every design system asks for that the library it started from did not ship.",
		theirs: "With a package",
		ours: "With the source in your repository",
		close:
			"HeroUI's own contributing guide is explicit about which side of that line a consumer is on — only the core team adds components, and behaviour is not changed without prior discussion, because the library is drawn from a design system its team maintains. That is a reasonable way to run a library. It is a bad fit for a product whose design outgrows the defaults, which is every product eventually.",
	},

	matrix: {
		eyebrow: "Side by side",
		title: "Every row, including the ones we lose.",
		body: "Three products: this library, HeroUI's free React Native library, and HeroUI Pro's licensed one. Every mark carries the note that says what it means — a tick with no explanation is a claim you cannot check.",
	},

	escape: {
		eyebrow: "Not a lock-in",
		title: "The npm package is right there.",
		body: "If your team would rather take updates than own files, install the package and skip the CLI entirely. It is the same source — the registry serves the library's own files rather than a copy of them — so the two can never drift.",
		move: "You can also start on the package and move later. Run delacour add button in a project that already installs delacour-react-native-ui, delete the package import, and point at the new path. Nothing about the component changes on the way across.",
		cli: { label: "Copy the source in", command: "delacour@alpha add button" },
		pkg: { label: "Or install the package", command: "delacour-react-native-ui@alpha" },
		link: "How the CLI works →",
	},

	/**
	 * The close, and deliberately one-sided.
	 *
	 * The honest three-way scoreboard is the `AGAINST` section above — a table
	 * whose crosses are in our own column, which `comparison.test.ts` will not
	 * let anyone quietly tidy away. That is where a reader learns HeroUI covers
	 * the web, has a company behind it and sells finished screens. Having paid
	 * that in full, the last section makes the case for this library instead of
	 * handing the reader back to the competitor. `otherwise` is the one line
	 * that still points away, because "almost always" is not "always" and a
	 * page that claims otherwise is the one nobody believes.
	 */
	verdict: {
		eyebrow: "The case",
		title: "Why you would pick Delacour UI.",
		body: "For a React Native product that will outlive its first design, this is the trade almost every team eventually wants: the components are yours from the first commit, and nothing about that costs you the updates.",
		reasons: [
			{
				title: "Your design will outgrow the defaults",
				body: (): string =>
					"Every product's design eventually asks for something the library it started from did not ship — a brand variant, a different corner, a state nobody anticipated. With the source in your repository that is an edit. With a package it is a wrapper you maintain forever, or a fork you maintain forever.",
			},
			{
				title: "You keep the updates anyway",
				body: (): string =>
					"Owning the files is usually a trade against ever upgrading again. It is not here: delacour diff shows what moved upstream on each component, prints both sides, and picks no winner. You take what you want and keep what you changed.",
			},
			{
				title: "Nothing is behind a licence",
				body: (count: number): string =>
					`All ${count} components are MIT, free, and installed from a public registry — no seats, no login, no HEROUI_AUTH_TOKEN in CI, and no paid tier holding back the components you actually need. The source you ship is yours to publish.`,
			},
			{
				title: "Your web theme is already your mobile theme",
				body: (): string =>
					"The palette is shadcn's, name for name. Paste the globals.css your web app already maintains, run delacour theme, and the mobile app matches the website — rather than learning a second token vocabulary and keeping the two in sync by hand.",
			},
			{
				title: "You can still change your mind",
				body: (): string =>
					"Start on the npm package if your team would rather take updates than own files, and copy components in later, one at a time, when one of them needs to change. The source is identical either way, so moving costs a changed import.",
			},
		],
		otherwise:
			"The exception is real and it is narrow: if you need React components for the web from the same system, or you are buying finished screens rather than components, HeroUI is the better purchase — and the table above says so in its own words.",
		cta: "Quick start",
	},

	sources: {
		title: "Sources",
		body: "Read from HeroUI's own documentation and terms. Prices are deliberately not quoted here: HeroUI publishes its tier names and its licence model but not the amounts, so the pricing page is the only honest citation. If something below has changed,",
		issues: "open an issue",
		issuesUrl: "https://github.com/delacournz/delacour-ui/issues/new",
		after: " and this page gets corrected.",
	},
} as const;
