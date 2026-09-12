import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { COMPONENT_INDEX_COPY } from "@/components/landing/copy";
import { ARROW_LINK } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { Eyebrow, SectionHeading } from "@/components/landing/section-heading";
import { PAGE_SECTION } from "@/components/section";
import { COMPONENT_GROUPS, COMPONENTS, componentsInGroup } from "@/lib/components";

/**
 * Every component by name, grouped as the docs group them. Reads `COMPONENTS`,
 * so a new component appears by existing — and the count in the heading is
 * the list's length, never a word that goes stale.
 */
export function ComponentIndex(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<SectionHeading eyebrow={COMPONENT_INDEX_COPY.eyebrow} title={COMPONENT_INDEX_COPY.title(COMPONENTS.length)} />
				<Link className={ARROW_LINK} params={{ _splat: "native/components" }} to="/docs/$">
					{COMPONENT_INDEX_COPY.link}
				</Link>
			</div>
			<div className="mt-section-gap grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
				{COMPONENT_GROUPS.map((group) => (
					<div className="flex flex-col gap-3" key={group}>
						<Eyebrow>{group}</Eyebrow>
						<ul className="flex flex-col gap-1.5">
							{componentsInGroup(group).map((component) => (
								<li key={component.slug}>
									<Link
										className="text-sm transition-colors hover:text-fd-primary"
										params={{ _splat: `native/components/${component.slug}` }}
										to="/docs/$"
									>
										{component.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</Reveal>
	);
}
