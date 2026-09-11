import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { SHOWCASE_COPY } from "@/components/landing/copy";
import { ARROW_LINK } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { ThemedPreview } from "@/components/preview";
import { COMPONENTS, type ComponentEntry } from "@/lib/components";
import { type PreviewId, previews } from "@/previews/manifest";

/**
 * The showcase. Each tile is a captured demo, chosen for how much of the
 * component it shows in one frame. `span` widens a tile whose capture is
 * landscape enough to need it.
 */
export type ShowcaseTile = {
	readonly slug: string;
	readonly preview: PreviewId;
	readonly span?: "wide";
};

export const SHOWCASE: readonly ShowcaseTile[] = [
	{ slug: "chart", preview: "chart/parts/dashboard", span: "wide" },
	{ slug: "button", preview: "button/variants" },
	{ slug: "switch", preview: "switch/tap-or-drag" },
	{ slug: "slider", preview: "slider/anatomy" },
	{ slug: "checkbox", preview: "checkbox/colours" },
	{ slug: "tabs", preview: "tabs/variants/every-variant" },
	{ slug: "input", preview: "input/variants/at-rest" },
	{ slug: "accordion", preview: "accordion/one-at-a-time", span: "wide" },
	{ slug: "badge", preview: "badge/variants-and-colours" },
	{ slug: "list-group", preview: "list-group/custom-suffix" },
	{ slug: "radio", preview: "radio/variants-and-states" },
	{ slug: "text", preview: "text/type-scale" },
	{ slug: "spinner", preview: "spinner/sizes" },
];

function componentBySlug(slug: string): ComponentEntry {
	const entry = COMPONENTS.find((component) => component.slug === slug);
	if (!entry) throw new Error(`Showcase names a component that is not in COMPONENTS: "${slug}"`);
	return entry;
}

/**
 * Real components, photographed on a real device.
 *
 * Every tile is a capture from `bun run previews`, which is the only way to
 * show these on the web at all — the library compiles under Metro, so nothing
 * here is a react-native-web imitation. The switch tile is a clip; the rest
 * are stills. The grid is the one place the page leaves its reading column:
 * thirteen pictures want the width, and the heading above them keeps the
 * column's left edge.
 */
export function Showcase(): ReactElement {
	return (
		<Reveal className="mx-auto w-full max-w-page px-6 py-section">
			<div className="flex flex-wrap items-end justify-between gap-6">
				<SectionHeading className="max-w-reading" eyebrow={SHOWCASE_COPY.eyebrow} title={SHOWCASE_COPY.title}>
					{SHOWCASE_COPY.body(COMPONENTS.length)}
				</SectionHeading>
				<Link className={ARROW_LINK} params={{ _splat: "native/components" }} to="/docs/$">
					{SHOWCASE_COPY.link}
				</Link>
			</div>

			<div className="mt-section-gap grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{SHOWCASE.map((tile) => (
					<ShowcaseCard key={tile.slug} tile={tile} />
				))}
			</div>
		</Reveal>
	);
}

/**
 * One card language, site-wide: the house card radius, a hairline, the card
 * surface. The capture sits on the page colour it was photographed on, so the
 * image meets its frame with no seam; the caption is one line and one blurb.
 */
export const CARD =
	"group/preview flex flex-col overflow-hidden rounded-card border border-fd-border bg-fd-card transition-colors hover:border-fd-primary/50";

function ShowcaseCard({ tile }: { tile: ShowcaseTile }): ReactElement {
	const component = componentBySlug(tile.slug);
	const entry = previews[tile.preview];
	const span = tile.span === "wide" ? "sm:col-span-2" : "";

	return (
		<Link className={`${CARD} ${span}`} params={{ _splat: `native/components/${component.slug}` }} to="/docs/$">
			<div className="flex h-56 items-center justify-center overflow-hidden bg-fd-background p-4">
				<ThemedPreview className="h-full w-full object-contain" entry={entry} />
			</div>
			<div className="flex items-start justify-between gap-3 border-fd-border border-t p-4">
				<div className="flex flex-col gap-1">
					<span className="font-medium text-sm">{component.name}</span>
					<span className="text-fd-muted-foreground text-xs">{component.blurb}</span>
				</div>
				<span
					aria-hidden
					className="text-fd-muted-foreground transition-[translate,color] group-hover/preview:translate-x-0.5 group-hover/preview:text-fd-primary"
				>
					→
				</span>
			</div>
		</Link>
	);
}
