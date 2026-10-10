import { Link } from "@tanstack/react-router";
import {
	Bell,
	Compass,
	Layers,
	LayoutGrid,
	List,
	type LucideIcon,
	MousePointerClick,
	Rows3,
	TextCursorInput,
	Wrench,
} from "lucide-react";
import { type ReactElement, useState } from "react";
import { COMPONENT_INDEX_COPY } from "@/components/landing/copy";
import { ARROW_LINK } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { ThemedPreview } from "@/components/preview";
import { PAGE_SECTION } from "@/components/section";
import { cn } from "@/lib/cn";
import {
	COMPONENT_GROUPS,
	COMPONENTS,
	type ComponentEntry,
	type ComponentGroup,
	componentsInGroup,
} from "@/lib/components";
import { heroPreviews, previews } from "@/previews/manifest";

/** One glyph per category, keyed by name so a reordered list keeps its pictures. */
const GROUP_ICONS: Readonly<Record<ComponentGroup, LucideIcon>> = {
	Actions: MousePointerClick,
	Forms: TextCursorInput,
	"Data display": Rows3,
	Feedback: Bell,
	Overlays: Layers,
	Navigation: Compass,
	Layout: LayoutGrid,
	Utilities: Wrench,
};

type Density = "stack" | "grid";

const DENSITIES: readonly { id: Density; label: string; Icon: LucideIcon }[] = [
	{ id: "stack", label: "Stack", Icon: List },
	{ id: "grid", label: "Grid", Icon: LayoutGrid },
];

/**
 * Every component, by category, at the density the reader picks.
 *
 * Reads `COMPONENTS`, so a new component appears by existing — and the count in
 * the heading is the list's length, never a word that goes stale. The default
 * is the stack: the showcase above already shows the pictures, so the index
 * opens as the map, a bordered icon tile per category over one row per
 * component. The grid toggle swaps each row for a 16:10 capture from the same
 * previews the docs index uses; the captures are lazy and the clips play only
 * while on screen, so choosing it costs nothing until it is chosen.
 */
export function ComponentIndex(): ReactElement {
	const [density, setDensity] = useState<Density>("stack");

	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<SectionHeading eyebrow={COMPONENT_INDEX_COPY.eyebrow} title={COMPONENT_INDEX_COPY.title(COMPONENTS.length)} />
				<div className="flex items-center gap-4">
					<DensityToggle density={density} onChange={setDensity} />
					<Link className={ARROW_LINK} params={{ _splat: "native/components" }} to="/docs/$">
						{COMPONENT_INDEX_COPY.link}
					</Link>
				</div>
			</div>
			<div className="mt-section-gap flex flex-col gap-10">
				{COMPONENT_GROUPS.map((group) => (
					<CategorySection density={density} group={group} key={group} />
				))}
			</div>
		</Reveal>
	);
}

/** The two-option segmented control, drawn as a tray with a raised active segment. */
function DensityToggle({ density, onChange }: { density: Density; onChange: (next: Density) => void }): ReactElement {
	return (
		<fieldset className="m-0 flex min-w-0 gap-0.5 rounded-lg border-0 bg-fd-muted/72 p-0.5">
			<legend className="sr-only">Density</legend>
			{DENSITIES.map(({ id, label, Icon }) => (
				<button
					aria-pressed={density === id}
					className={cn(
						"inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] text-fd-muted-foreground transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.97]",
						density === id ? "raised bg-fd-card text-fd-foreground" : "hover:text-fd-foreground"
					)}
					key={id}
					onClick={() => onChange(id)}
					type="button"
				>
					<Icon aria-hidden className="size-3.5" />
					{label}
				</button>
			))}
		</fieldset>
	);
}

function CategorySection({ group, density }: { group: ComponentGroup; density: Density }): ReactElement {
	const Icon = GROUP_ICONS[group];
	const entries = componentsInGroup(group);

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<span className="raised flex size-8 items-center justify-center rounded-lg border border-fd-border bg-fd-card text-fd-muted-foreground">
					<Icon aria-hidden className="size-4" />
				</span>
				<h3 className="text-base">{group}</h3>
				<span className="kicker rounded-md border border-fd-border/70 px-1.5 tracking-widest">{entries.length}</span>
			</div>

			{density === "grid" ? (
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{entries.map((component) => (
						<li key={component.slug}>
							<GridCard component={component} />
						</li>
					))}
				</ul>
			) : (
				<ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
					{entries.map((component) => (
						<li key={component.slug}>
							<StackRow component={component} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function StackRow({ component }: { component: ComponentEntry }): ReactElement {
	return (
		<Link
			className="flex h-8 items-center rounded-lg px-2 text-[13px] transition-colors duration-150 ease-out hover:bg-(--hover-fill)"
			params={{ _splat: `native/components/${component.slug}` }}
			to="/docs/$"
		>
			{component.name}
		</Link>
	);
}

/**
 * A component as a nested tray: a 16:10 capture on the capture colour inside a
 * rounded panel, the name and blurb under it. A component with no captured hero
 * keeps its card with a placeholder rather than a gap, because the page is the
 * map of the library and a component missing from it reads as one that does not
 * exist.
 */
function GridCard({ component }: { component: ComponentEntry }): ReactElement {
	const heroId = heroPreviews[component.slug];
	const hero = heroId ? previews[heroId] : undefined;

	return (
		<Link
			className="tray group/card block transition-[border-color,scale] duration-150 ease-out hover:border-fd-foreground/25 active:scale-[0.99]"
			params={{ _splat: `native/components/${component.slug}` }}
			to="/docs/$"
		>
			<span className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-capture">
				{hero ? (
					<ThemedPreview className="h-full w-full object-contain" entry={hero} fill />
				) : (
					<span className="kicker">No preview yet</span>
				)}
			</span>
			<span className="flex flex-col gap-0.5 px-2 pt-2.5 pb-2">
				<span className="font-medium text-[13px]">{component.name}</span>
				<span className="line-clamp-2 text-[11px] text-fd-muted-foreground leading-relaxed">{component.blurb}</span>
			</span>
		</Link>
	);
}
