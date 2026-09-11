import {
	Accessibility,
	Blocks,
	FileCode2,
	FlaskConical,
	type LucideIcon,
	SlidersHorizontal,
	Smartphone,
} from "lucide-react";
import type { ReactElement } from "react";
import { FEATURES_COPY } from "@/components/landing/copy";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";

/**
 * A glyph per principle, from the site's one icon set, keyed by the title so
 * a reordered list keeps its pictures. Drawn at `size-icon-lg` from the
 * library's own icon scale, in the accent — each is the marker for its row,
 * the way the eyebrow dot marks a section.
 */
const GLYPHS: Readonly<Record<(typeof FEATURES_COPY.items)[number]["title"], LucideIcon>> = {
	Composable: Blocks,
	Accessible: Accessibility,
	"Thoughtful defaults": SlidersHorizontal,
	"Yours to own": FileCode2,
	"Built for the platform": Smartphone,
	"Typed and tested": FlaskConical,
};

/**
 * The principles, as a list rather than a grid of cards: six rows in the
 * reading column, each a glyph, a title and one paragraph, divided by
 * hairlines. The column is the argument — you read them, in order.
 */
export function Features(): ReactElement {
	return (
		<Reveal className="mx-auto w-full max-w-reading px-6 py-section">
			<SectionHeading eyebrow={FEATURES_COPY.eyebrow} title={FEATURES_COPY.title}>
				{FEATURES_COPY.body}
			</SectionHeading>
			<ul className="mt-section-gap flex flex-col divide-y divide-fd-border">
				{FEATURES_COPY.items.map((feature) => {
					const Glyph = GLYPHS[feature.title];

					return (
						<li className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-5 first:pt-0 last:pb-0" key={feature.title}>
							<Glyph aria-hidden className="mt-0.5 size-icon-lg text-fd-primary" strokeWidth={1.75} />
							<h3 className="text-base">{feature.title}</h3>
							<p className="col-start-2 text-fd-muted-foreground text-sm">{feature.body}</p>
						</li>
					);
				})}
			</ul>
		</Reveal>
	);
}
