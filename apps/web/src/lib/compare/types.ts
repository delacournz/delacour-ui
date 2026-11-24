import type { Answer } from "../comparison";

export type { Answer, Support } from "../comparison";

/** One feature, answered by both libraries. */
export type TwoWayRow = { readonly feature: string; readonly delacour: Answer; readonly them: Answer };

export type TwoWaySection = {
	readonly id: string;
	readonly title: string;
	readonly blurb: string;
	readonly rows: readonly TwoWayRow[];
};

export type CompareSource = { readonly label: string; readonly href: string };

/**
 * A `/compare/<slug>` page, whole. Like `comparison.ts` for HeroUI, the page
 * renders this and writes nothing about the other library itself — every claim
 * is a row here, and every row was read from a page in `sources`.
 */
export type Comparison = {
	readonly slug: string;
	/** The other library's name, as its own site writes it. */
	readonly name: string;
	readonly tagline: string;
	readonly href: string;
	/** `<title>` — at most 60 characters. */
	readonly title: string;
	/** Meta description — at most 160 characters. */
	readonly description: string;
	/** The hub card's one line. */
	readonly summary: string;
	readonly eyebrow: string;
	readonly headline: string;
	readonly lede: string;
	readonly sections: readonly TwoWaySection[];
	/** Where the other library is the better choice, in a sentence a reader could act on. */
	readonly choose: { readonly them: string; readonly us: string };
	readonly sources: readonly CompareSource[];
	/** The day the sources were read, `YYYY-MM-DD`. */
	readonly checked: string;
};
