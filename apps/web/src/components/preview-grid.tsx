import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { ThemedPreview } from "@/components/preview";
import { COMPONENT_GROUPS, type ComponentEntry, componentsInGroup } from "@/lib/components";
import { heroPreviews, previews } from "@/previews/manifest";

/**
 * Every component, grouped, each fronted by its hero preview.
 *
 * The card is the picture. A component index whose cards are text is a list of
 * words for things that are entirely visual, and the reader has to open every
 * one to find the control they half-remember.
 *
 * A component with no captured hero still gets a card — with a placeholder
 * rather than a gap, because the page is the map of the library and a component
 * missing from it reads as a component that does not exist.
 */
export function PreviewGrid(): ReactElement {
	return (
		<div className="not-prose flex flex-col gap-10">
			{COMPONENT_GROUPS.map((group) => (
				<section key={group}>
					<h2 className="mb-4 font-medium text-fd-muted-foreground text-sm uppercase tracking-wide">{group}</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{componentsInGroup(group).map((component) => (
							<ComponentCard component={component} key={component.slug} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}

function ComponentCard({ component }: { component: ComponentEntry }): ReactElement {
	const heroId = heroPreviews[component.slug];
	const hero = heroId ? previews[heroId] : undefined;

	return (
		<Link
			className="group/preview flex flex-col overflow-hidden rounded-xl border border-fd-border transition-colors hover:border-fd-foreground/25"
			params={{ _splat: `native/components/${component.slug}` }}
			to="/docs/$"
		>
			<div className="flex h-40 items-center justify-center overflow-hidden border-fd-border border-b bg-fd-background">
				{hero ? (
					<ThemedPreview entry={hero} className="h-full w-full object-contain" />
				) : (
					<span className="text-fd-muted-foreground text-xs">No preview yet</span>
				)}
			</div>
			<div className="flex flex-col gap-1 p-4">
				<span className="font-medium text-sm">{component.name}</span>
				<span className="text-fd-muted-foreground text-xs leading-relaxed">{component.blurb}</span>
			</div>
		</Link>
	);
}
