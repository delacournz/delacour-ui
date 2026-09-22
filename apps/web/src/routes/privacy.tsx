import { createFileRoute } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
import { Footer } from "@/components/landing/footer";
import { RichText } from "@/components/landing/rich-text";
import { Eyebrow } from "@/components/landing/section-heading";
import { PAGE_SECTION } from "@/components/section";
import { homeOptions } from "@/lib/layout.shared";
import { type Disclosure, PRIVACY, PRIVACY_SECTIONS, type PrivacySection } from "@/lib/privacy";
import { appName } from "@/lib/shared";

/**
 * `/privacy` — the policy both store listings and the app's home screen link to.
 *
 * Every word is read from `src/lib/privacy.ts`, where `privacy.test.ts` holds
 * the claims to the code they describe; nothing is written in this file. It is
 * a marketing route rather than a docs page for the reason `/compare/heroui`
 * is: it tells a reader nothing about using the library.
 *
 * It is a document, so it is drawn quieter than the landing page. No `Reveal`
 * — a policy is read top to bottom and nothing in it should arrive late — and
 * a title step for each heading rather than the landing's headline step, which
 * ten times down one page would shout. Prose keeps the reading measure; the
 * disclosure tables span the container, like every other table on the site.
 * Amber appears only on the links, which is the One Amber Rule doing its job.
 *
 * The date is formatted in UTC so the server and the browser print the same
 * day, whatever time zone either is in.
 */
export const Route = createFileRoute("/privacy")({
	component: Privacy,
	head: () => ({
		meta: [{ title: `${PRIVACY.title} — ${appName}` }, { name: "description", content: PRIVACY.description }],
	}),
});

const UPDATED = new Date(`${PRIVACY.updated}T00:00:00Z`).toLocaleDateString("en-NZ", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "UTC",
});

function Privacy(): ReactElement {
	return (
		<HomeLayout {...homeOptions()}>
			<Header />
			<div className={`${PAGE_SECTION} flex flex-col gap-section-sm pb-section`}>
				<Glance />
				{PRIVACY_SECTIONS.map((section) => (
					<Section key={section.id} section={section} />
				))}
			</div>
			<Footer />
		</HomeLayout>
	);
}

function Header(): ReactElement {
	return (
		<section className={`${PAGE_SECTION} flex flex-col items-start gap-5 pt-section-sm pb-section-gap`}>
			<Eyebrow>{PRIVACY.eyebrow}</Eyebrow>
			<h1 className="max-w-reading text-4xl leading-[1.1] sm:text-5xl">{PRIVACY.title}</h1>
			<p className="max-w-reading text-fd-muted-foreground text-lg">{PRIVACY.lede}</p>
			<p className="text-fd-muted-foreground text-sm">
				Last updated <time dateTime={PRIVACY.updated}>{UPDATED}</time>
			</p>
		</section>
	);
}

/** The five sentences a reader who stops here should leave with. */
function Glance(): ReactElement {
	return (
		<section aria-labelledby="at-a-glance" className="flex flex-col gap-4">
			<h2 className="scroll-mt-24 text-2xl" id="at-a-glance">
				At a glance
			</h2>
			<ul className="max-w-reading divide-y divide-fd-border border-fd-border border-y">
				{PRIVACY.glance.map((line) => (
					<li className="py-4" key={line}>
						<RichText text={line} />
					</li>
				))}
			</ul>
		</section>
	);
}

function Section({ section }: { section: PrivacySection }): ReactElement {
	return (
		<section aria-labelledby={section.id} className="flex flex-col gap-4">
			<h2 className="scroll-mt-24 text-2xl" id={section.id}>
				{section.title}
			</h2>
			<Prose paragraphs={section.body} />
			{section.disclosures ? <DisclosureTable rows={section.disclosures} /> : null}
			{section.after ? <Prose paragraphs={section.after} /> : null}
		</section>
	);
}

function Prose({ paragraphs }: { paragraphs: readonly string[] }): ReactElement {
	return (
		<div className="flex max-w-reading flex-col gap-4">
			{paragraphs.map((paragraph) => (
				<p key={paragraph}>
					<RichText text={paragraph} />
				</p>
			))}
		</div>
	);
}

const COLUMNS = "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)]";

const HEADINGS = ["What", "Goes to", "Why"] as const;

/**
 * What, to whom, why — three columns from `md`, and a stack of labelled cells
 * below it, where three columns of sentences would be a word wide each.
 *
 * Each row is a description list rather than a `<table>` row: a table whose
 * rows turn into grids at phone width loses its table semantics in Safari, and
 * a `<dl>` says "What: …, Goes to: …, Why: …" at every width. The header strip
 * above the rows is therefore decoration, and hidden from assistive tech; each
 * cell's own `<dt>` carries its label, drawn only where the strip is not.
 */
function DisclosureTable({ rows }: { rows: readonly Disclosure[] }): ReactElement {
	return (
		<div className="overflow-hidden rounded-card border border-fd-border">
			<div aria-hidden className={`hidden border-fd-border border-b md:grid ${COLUMNS}`}>
				{HEADINGS.map((heading) => (
					<p
						className="px-4 py-3 font-medium text-fd-muted-foreground text-xs uppercase tracking-eyebrow"
						key={heading}
					>
						{heading}
					</p>
				))}
			</div>

			{rows.map((row) => (
				<dl className={`grid border-fd-border border-b last:border-b-0 ${COLUMNS}`} key={row.what}>
					<Cell heading="What" text={row.what} />
					<Cell heading="Goes to" text={row.to} />
					<Cell heading="Why" text={row.why} />
				</dl>
			))}
		</div>
	);
}

function Cell({ heading, text }: { heading: (typeof HEADINGS)[number]; text: string }): ReactElement {
	return (
		<div className="flex min-w-0 flex-col gap-1 px-4 py-4 text-sm">
			<dt className="font-medium text-fd-muted-foreground text-xs uppercase tracking-eyebrow md:sr-only">{heading}</dt>
			<dd>
				<RichText text={text} />
			</dd>
		</div>
	);
}
