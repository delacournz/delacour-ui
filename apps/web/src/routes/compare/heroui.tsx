import { createFileRoute, Link } from "@tanstack/react-router";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Check, Minus, X } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { InstallTabs } from "@/components/install";
import { Footer } from "@/components/landing/footer";
import { ARROW_LINK, PILL_GHOST, PillLink } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { Eyebrow, SectionHeading } from "@/components/landing/section-heading";
import { PAGE_SECTION } from "@/components/section";
import { cn } from "@/lib/cn";
import {
	type Answer,
	CODE_SAMPLES,
	COMPARE_COPY,
	PRODUCTS,
	type Row,
	SECTIONS,
	type Section,
	SOURCES,
	type Support,
} from "@/lib/comparison";
import { COMPONENTS } from "@/lib/components";
import { homeOptions } from "@/lib/layout.shared";
import { appName } from "@/lib/shared";

/**
 * `/compare/heroui` — the one page on this site that argues.
 *
 * Every claim it makes is read from `src/lib/comparison.ts`, which carries the
 * source each was read from and is held to its shape — and to its concessions
 * — by `comparison.test.ts`. Nothing about HeroUI is written in this file, so
 * a fact that moves is one edit in one place rather than a hunt through JSX.
 *
 * It is a marketing route rather than a docs page because it is not
 * documentation: it does not tell a reader how to do anything, and a
 * comparison against a named competitor in the Getting Started sidebar would
 * be the site's own voice arguing in the middle of its instructions.
 *
 * It is drawn in the house world `DESIGN.md` sets, through the landing page's
 * own parts — `Reveal`, `SectionHeading`, the pills, the footer. Two of that
 * world's rules bite hardest here and are the reason this page looks calmer
 * than a comparison page usually does: sections separate with the vertical
 * rhythm rather than with rules or tinted bands, and **amber marks only what a
 * reader can act on**, so sixty-nine ticks and crosses are ink and hairline —
 * an amber tick in every other row would be the wash the One Amber Rule
 * exists to prevent.
 */
export const Route = createFileRoute("/compare/heroui")({
	component: CompareHeroUI,
	head: () => ({
		meta: [
			{ title: `${appName} vs HeroUI — where the component code lives` },
			{ name: "description", content: COMPARE_COPY.description },
		],
	}),
});

function CompareHeroUI(): ReactElement {
	return (
		<HomeLayout {...homeOptions()}>
			<Hero />
			<TheChange />
			<Matrix />
			<Escape />
			<Verdict />
			<Sources />
			<Footer />
		</HomeLayout>
	);
}

function Hero(): ReactElement {
	return (
		<section className={`${PAGE_SECTION} flex flex-col items-start gap-8 pt-section-sm pb-section`}>
			<Eyebrow>{COMPARE_COPY.eyebrow}</Eyebrow>
			<div className="flex flex-col gap-5">
				<h1 className="max-w-reading text-4xl leading-[1.1] sm:text-5xl">{COMPARE_COPY.title}</h1>
				<p className="max-w-reading text-fd-muted-foreground text-lg">{COMPARE_COPY.lede}</p>
			</div>

			<div className="grid w-full gap-4 lg:grid-cols-2">
				{COMPARE_COPY.where.map((card) => (
					<WhereCard card={card} key={card.path} />
				))}
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<PillLink params={{ _splat: "native/getting-started" }} to="/docs/$">
					{COMPARE_COPY.primary}
				</PillLink>
				<a className={PILL_GHOST} href="#matrix">
					{COMPARE_COPY.secondary}
				</a>
			</div>
		</section>
	);
}

function WhereCard({ card }: { card: (typeof COMPARE_COPY.where)[number] }): ReactElement {
	return (
		<div
			className={cn(
				"flex min-w-0 flex-col gap-1.5 rounded-card border p-5",
				// A ring, never a fill: the same amber marker the customiser puts on
				// a selected tile, and the reason the One Amber Rule tolerates it.
				card.ours ? "border-fd-primary/30 bg-fd-card" : "border-fd-border bg-fd-card/50"
			)}
		>
			<p className="font-medium text-fd-muted-foreground text-xs uppercase tracking-eyebrow">{card.label}</p>
			<code className="font-mono text-fd-foreground text-sm">{card.path}</code>
			<p className="mt-1.5 text-fd-muted-foreground text-sm">{card.body}</p>
		</div>
	);
}

/** The argument, once, in the smallest change a real team actually makes. */
function TheChange(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<SectionHeading eyebrow={COMPARE_COPY.change.eyebrow} title={COMPARE_COPY.change.title}>
				{COMPARE_COPY.change.body}
			</SectionHeading>

			<div className="mt-section-gap grid gap-6 lg:grid-cols-2 lg:items-start">
				<div className="flex min-w-0 flex-col gap-2">
					<p className="font-medium text-fd-muted-foreground text-sm">{COMPARE_COPY.change.theirs}</p>
					<DynamicCodeBlock code={CODE_SAMPLES.wrapper} lang="tsx" />
				</div>
				<div className="flex min-w-0 flex-col gap-2">
					<p className="font-medium text-fd-muted-foreground text-sm">{COMPARE_COPY.change.ours}</p>
					<DynamicCodeBlock code={CODE_SAMPLES.variant} lang="ts" />
				</div>
			</div>

			<p className="mt-section-gap max-w-reading text-fd-muted-foreground">{COMPARE_COPY.change.close}</p>
		</Reveal>
	);
}

/** Four tables, each the width of the page container the whole page takes. */
function Matrix(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} scroll-mt-20 py-section`} id="matrix">
			<SectionHeading eyebrow={COMPARE_COPY.matrix.eyebrow} title={COMPARE_COPY.matrix.title}>
				{COMPARE_COPY.matrix.body}
			</SectionHeading>

			<div className="mt-section-gap flex flex-col gap-section-sm">
				{SECTIONS.map((section) => (
					<SectionTable key={section.id} section={section} />
				))}
			</div>
		</Reveal>
	);
}

const COLUMNS = "md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]";

function SectionTable({ section }: { section: Section }): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex max-w-reading flex-col gap-2">
				<h3 className="text-2xl">{section.title}</h3>
				<p className="text-fd-muted-foreground">{section.blurb}</p>
			</div>

			<div className="overflow-hidden rounded-card border border-fd-border">
				<div className={cn("hidden border-fd-border border-b md:grid", COLUMNS)}>
					<div className="px-4 py-3" />
					{PRODUCTS.map((product) => (
						<div className="px-4 py-3 text-center" key={product.id}>
							<a
								className="font-medium text-sm underline decoration-fd-border underline-offset-4 transition-colors hover:decoration-fd-primary"
								href={product.href}
								rel={product.href.startsWith("http") ? "noreferrer noopener" : undefined}
								target={product.href.startsWith("http") ? "_blank" : undefined}
							>
								{product.name}
							</a>
							<p className="mt-0.5 text-fd-muted-foreground text-xs">{product.tagline}</p>
						</div>
					))}
				</div>

				{section.rows.map((row) => (
					<MatrixRow key={row.feature} row={row} />
				))}
			</div>
		</div>
	);
}

function MatrixRow({ row }: { row: Row }): ReactElement {
	return (
		<div className={cn("grid border-fd-border border-b last:border-b-0 md:items-stretch", COLUMNS)}>
			<div className="px-4 py-4">
				<p className="font-medium text-sm">{row.feature}</p>
			</div>
			{PRODUCTS.map((product) => (
				<Cell answer={row[product.id]} key={product.id} ours={product.id === "delacour"} product={product.name} />
			))}
		</div>
	);
}

function Cell({ product, answer, ours }: { product: string; answer: Answer; ours: boolean }): ReactElement {
	return (
		<div className={cn("px-4 py-4 md:text-center", ours && "bg-fd-card/60")}>
			<div className="flex items-start gap-2 md:flex-col md:items-center md:gap-1.5">
				<Mark support={answer.support} />
				<div className="min-w-0">
					<p className="font-medium text-fd-muted-foreground text-xs md:hidden">{product}</p>
					<p className="text-fd-muted-foreground text-xs">{answer.note}</p>
				</div>
			</div>
		</div>
	);
}

/**
 * The mark, and the word for it — both, always. An icon alone is invisible to
 * a screen reader and ambiguous in a monochrome print or a high-contrast mode.
 *
 * Ink and hairline rather than the accent: see the route's own note on the One
 * Amber Rule.
 */
function Mark({ support }: { support: Support }): ReactElement {
	const shell = "inline-flex size-5 shrink-0 items-center justify-center rounded-full";

	if (support === "yes") {
		return (
			<span className={cn(shell, "bg-fd-foreground text-fd-background")}>
				<Check aria-hidden className="size-3.5" strokeWidth={3} />
				<span className="sr-only">Yes</span>
			</span>
		);
	}

	if (support === "partial") {
		return (
			<span className={cn(shell, "border border-fd-border bg-fd-muted text-fd-muted-foreground")}>
				<Minus aria-hidden className="size-3.5" strokeWidth={3} />
				<span className="sr-only">Partly</span>
			</span>
		);
	}

	return (
		<span className={cn(shell, "border border-fd-border text-fd-muted-foreground")}>
			<X aria-hidden className="size-3.5" strokeWidth={3} />
			<span className="sr-only">No</span>
		</span>
	);
}

/**
 * The concession the ownership argument needs to stay honest: owning the code
 * is a choice this library offers, not a toll it charges.
 */
function Escape(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<SectionHeading eyebrow={COMPARE_COPY.escape.eyebrow} title={COMPARE_COPY.escape.title}>
				{COMPARE_COPY.escape.body}
			</SectionHeading>

			<p className="mt-section-gap max-w-reading text-fd-muted-foreground">{COMPARE_COPY.escape.move}</p>

			<div className="mt-6 grid gap-6 lg:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-2">
					<p className="font-medium text-fd-muted-foreground text-sm">{COMPARE_COPY.escape.cli.label}</p>
					<InstallTabs commands={[{ verb: "dlx", packages: [COMPARE_COPY.escape.cli.command] }]} />
				</div>
				<div className="flex min-w-0 flex-col gap-2">
					<p className="font-medium text-fd-muted-foreground text-sm">{COMPARE_COPY.escape.pkg.label}</p>
					<InstallTabs commands={[{ verb: "add", packages: [COMPARE_COPY.escape.pkg.command] }]} />
				</div>
			</div>

			<Link className={cn(ARROW_LINK, "mt-6")} params={{ _splat: "native/cli" }} to="/docs/$">
				{COMPARE_COPY.escape.link}
			</Link>
		</Reveal>
	);
}

/**
 * The case for this library, as a divided list — the same shape the landing
 * page's principles take, and for the same reason: you read them in order.
 *
 * It used to be a three-way "which one you should use", with a card telling a
 * reader to buy HeroUI Pro. That was a fair scoreboard and a bad closing
 * argument: a page spends its last section making its case, not handing the
 * reader back to the competitor it just compared itself to. The concession is
 * still on the page, in full, one section up — **Where HeroUI is ahead** is a
 * table with the crosses in our own column, and `comparison.test.ts` will not
 * let it be tidied away. Having been honest there buys the right to close
 * here.
 */
function Verdict(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} scroll-mt-20 py-section`} id="case">
			<SectionHeading eyebrow={COMPARE_COPY.verdict.eyebrow} title={COMPARE_COPY.verdict.title}>
				{COMPARE_COPY.verdict.body}
			</SectionHeading>
			<ul className="mt-section-gap grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
				{COMPARE_COPY.verdict.reasons.map((reason) => (
					<li
						className="flex flex-col gap-1 border-fd-border border-t py-5 sm:[&:nth-child(-n+2)]:border-t-0 lg:[&:nth-child(-n+3)]:border-t-0 [&:first-child]:border-t-0"
						key={reason.title}
					>
						<h3 className="text-base">{reason.title}</h3>
						<p className="text-fd-muted-foreground text-sm">{reason.body(COMPONENTS.length)}</p>
					</li>
				))}
			</ul>
			<p className="mt-section-gap max-w-reading text-fd-muted-foreground text-sm">{COMPARE_COPY.verdict.otherwise}</p>
			<div className="mt-6 flex flex-wrap items-center gap-3">
				<PillLink params={{ _splat: "native/getting-started" }} to="/docs/$">
					{COMPARE_COPY.verdict.cta}
				</PillLink>
			</div>
		</Reveal>
	);
}

/**
 * A comparison page without its sources is an assertion. HeroUI's own
 * documentation is where every claim above was read, and a reader who thinks
 * one of them is wrong should be one click from checking.
 */
function Sources(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} pb-section`}>
			<h2 className="font-medium text-fd-muted-foreground text-sm uppercase tracking-eyebrow">
				{COMPARE_COPY.sources.title}
			</h2>
			<p className="mt-3 max-w-reading text-fd-muted-foreground text-sm">
				{COMPARE_COPY.sources.body}{" "}
				<a
					className="underline decoration-fd-border underline-offset-4 transition-colors hover:decoration-fd-primary"
					href={COMPARE_COPY.sources.issuesUrl}
					rel="noreferrer noopener"
					target="_blank"
				>
					{COMPARE_COPY.sources.issues}
				</a>
				{COMPARE_COPY.sources.after}
			</p>
			<ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
				{SOURCES.map((source) => (
					<li key={source.href}>
						<SourceLink href={source.href}>{source.label}</SourceLink>
					</li>
				))}
			</ul>
		</Reveal>
	);
}

function SourceLink({ href, children }: { href: string; children: ReactNode }): ReactElement {
	return (
		<a
			className="text-fd-muted-foreground underline decoration-fd-border underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-primary"
			href={href}
			rel="noreferrer noopener"
			target="_blank"
		>
			{children}
		</a>
	);
}
