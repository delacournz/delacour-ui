import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
import { Footer } from "@/components/landing/footer";
import { Eyebrow } from "@/components/landing/section-heading";
import { COLUMN_SECTION, PAGE_SECTION } from "@/components/section";
import { HUB_COPY, HUB_ENTRIES } from "@/lib/compare";
import { homeOptions } from "@/lib/layout.shared";
import { pageHead } from "@/lib/seo";

/**
 * `/compare` — one card per comparison, so the footer has one link and a search
 * for "react native ui library comparison" has a page to land on. The cards are
 * `HUB_ENTRIES`; a new comparison appears by existing.
 */
export const Route = createFileRoute("/compare/")({
	component: CompareHub,
	head: () => pageHead({ path: "/compare", title: HUB_COPY.title, description: HUB_COPY.description }),
});

function CompareHub(): ReactElement {
	return (
		<HomeLayout {...homeOptions()}>
			<section className={`${COLUMN_SECTION} flex flex-col items-start gap-5 pt-section-sm pb-section-sm`}>
				<Eyebrow>{HUB_COPY.eyebrow}</Eyebrow>
				<h1 className="text-3xl">{HUB_COPY.headline}</h1>
				<p className="text-fd-muted-foreground text-sm leading-relaxed">{HUB_COPY.lede}</p>
			</section>
			<section className={`${PAGE_SECTION} pb-section`}>
				<ul className="grid gap-4 md:grid-cols-3">
					{HUB_ENTRIES.map((entry) => (
						<li key={entry.path}>
							<Link
								className="flex h-full flex-col gap-2 rounded-card border border-fd-border p-5 transition-colors hover:bg-fd-accent/40"
								to={entry.path}
							>
								<span className="font-medium">Delacour UI vs {entry.name}</span>
								<span className="text-fd-muted-foreground text-sm">{entry.summary}</span>
							</Link>
						</li>
					))}
				</ul>
			</section>
			<Footer />
		</HomeLayout>
	);
}
