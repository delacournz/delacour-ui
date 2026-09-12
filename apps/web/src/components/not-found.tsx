import { Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { ARROW_LINK, PillLink } from "@/components/landing/pill";
import { PAGE_SECTION } from "@/components/section";
import { homeOptions } from "@/lib/layout.shared";

/**
 * The page that is not there, in the house: the mark, the heading face, and
 * the two places a reader most likely meant — the docs and the components.
 *
 * It replaces Fumadocs' default so a wrong URL still lands somewhere that
 * looks like the site, with the pill nav above it and a way on.
 */
export function NotFound(): ReactElement {
	return (
		<HomeLayout {...homeOptions()}>
			<main className={`${PAGE_SECTION} flex flex-1 flex-col items-start justify-center gap-8 py-section`}>
				<DelacourIcon size={48} />
				<div className="flex flex-col gap-4">
					<p className="font-mono text-fd-muted-foreground text-sm">404</p>
					<h1 className="text-4xl sm:text-5xl">There is no page here.</h1>
					<p className="max-w-reading text-fd-muted-foreground text-lg">
						The address may have changed, or it was never one of ours. The docs and the component index are the two
						places most links mean.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<PillLink params={{ _splat: "native/getting-started" }} to="/docs/$">
						Read the docs
					</PillLink>
					<PillLink params={{ _splat: "native/components" }} to="/docs/$" variant="ghost">
						Browse components
					</PillLink>
					<Link className={`${ARROW_LINK} px-2`} to="/">
						Home →
					</Link>
				</div>
			</main>
		</HomeLayout>
	);
}
