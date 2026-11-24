import { createFileRoute, notFound } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
import { TwoWayTable } from "@/components/compare/two-way-table";
import { Footer } from "@/components/landing/footer";
import { PILL_GHOST, PillLink } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { Eyebrow } from "@/components/landing/section-heading";
import { COLUMN_SECTION, PAGE_SECTION } from "@/components/section";
import { type Comparison, comparisonBySlug } from "@/lib/compare";
import { homeOptions } from "@/lib/layout.shared";
import { pageHead } from "@/lib/seo";

/**
 * `/compare/<slug>` — Delacour UI against one other library, two columns.
 * Renders `src/lib/compare/<slug>.ts` and writes nothing about the other
 * library itself; `/compare/heroui`, a static route, wins over this one.
 */
export const Route = createFileRoute("/compare/$slug")({
	component: ComparePage,
	loader: ({ params }) => {
		if (!comparisonBySlug(params.slug)) throw notFound();
		return { slug: params.slug };
	},
	head: ({ loaderData }) => {
		const comparison = loaderData ? comparisonBySlug(loaderData.slug) : undefined;
		if (!comparison) return {};
		return pageHead({
			path: `/compare/${comparison.slug}`,
			title: comparison.title,
			description: comparison.description,
		});
	},
});

function ComparePage(): ReactElement {
	const { slug } = Route.useLoaderData();
	const comparison = comparisonBySlug(slug);
	if (!comparison) throw notFound();

	return (
		<HomeLayout {...homeOptions()}>
			<Hero comparison={comparison} />
			<Reveal className={`${PAGE_SECTION} scroll-mt-20 pb-section`} id="matrix">
				<div className="flex flex-col gap-section-sm">
					{comparison.sections.map((section) => (
						<TwoWayTable comparison={comparison} key={section.id} section={section} />
					))}
				</div>
			</Reveal>
			<Choose comparison={comparison} />
			<Sources comparison={comparison} />
			<Footer />
		</HomeLayout>
	);
}

function Hero({ comparison }: { comparison: Comparison }): ReactElement {
	return (
		<section className={`${COLUMN_SECTION} flex flex-col items-start gap-8 pt-section-sm pb-section`}>
			<Eyebrow>{comparison.eyebrow}</Eyebrow>
			<div className="flex flex-col gap-5">
				<h1 className="text-3xl">{comparison.headline}</h1>
				<p className="text-fd-muted-foreground text-sm leading-relaxed">{comparison.lede}</p>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<PillLink params={{ _splat: "native/getting-started" }} to="/docs/$">
					Quick start
				</PillLink>
				<a className={PILL_GHOST} href="#matrix">
					Jump to the table
				</a>
			</div>
		</section>
	);
}

/** Both directions, the other library's first — the table already made our case. */
function Choose({ comparison }: { comparison: Comparison }): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<h2 className="text-2xl">Which one</h2>
			<div className="mt-6 grid gap-6 sm:grid-cols-2">
				<p className="text-fd-muted-foreground text-sm leading-relaxed">{comparison.choose.them}</p>
				<p className="text-fd-muted-foreground text-sm leading-relaxed">{comparison.choose.us}</p>
			</div>
		</Reveal>
	);
}

function Sources({ comparison }: { comparison: Comparison }): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} pb-section`}>
			<h2 className="kicker">Sources</h2>
			<p className="mt-3 max-w-reading text-fd-muted-foreground text-sm">
				Every row on {comparison.name}'s side was read from these pages on {comparison.checked}. If one is out of date,
				open an issue and it will be corrected.
			</p>
			<ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
				{comparison.sources.map((source) => (
					<li key={source.href}>
						<a
							className="text-fd-muted-foreground underline decoration-fd-border underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-primary"
							href={source.href}
							rel="noreferrer noopener"
							target="_blank"
						>
							{source.label}
						</a>
					</li>
				))}
			</ul>
		</Reveal>
	);
}
