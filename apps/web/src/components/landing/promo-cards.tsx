import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { THEME_TEASER_COPY, TOKENS_COPY } from "@/components/landing/copy";
import { ARROW_LINK } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { PAGE_SECTION } from "@/components/section";
import { cn } from "@/lib/cn";

/**
 * Two promo cards under the hero, each pointing at the thing the library does
 * that a component list cannot: the theme customiser, and the token bridge from
 * a web `globals.css`. Every word is read from the existing section copy, so
 * the cards add no claim the sections below do not already make and
 * `copy.test.ts` still holds all of it.
 *
 * Each card is a tray around a panel, with one soft blurred glow mixed from the
 * foreground behind its corner — decoration only, `aria-hidden`, clipped by the
 * card, and gone when the theme's foreground is.
 */
export function PromoCards(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} pb-section`}>
			<div className="grid gap-4 md:grid-cols-2">
				<PromoCard
					eyebrow={THEME_TEASER_COPY.eyebrow}
					glow="-top-16 -right-12"
					link={
						<Link className={ARROW_LINK} search={{}} to="/theme">
							{THEME_TEASER_COPY.link}
						</Link>
					}
					title={THEME_TEASER_COPY.title}
				>
					{THEME_TEASER_COPY.body}
				</PromoCard>
				<PromoCard
					eyebrow={TOKENS_COPY.eyebrow}
					glow="-bottom-20 -left-12"
					link={
						<Link className={ARROW_LINK} params={{ _splat: "native/getting-started/theming" }} to="/docs/$">
							{TOKENS_COPY.link}
						</Link>
					}
					title={TOKENS_COPY.title}
				/>
			</div>
		</Reveal>
	);
}

function PromoCard({
	eyebrow,
	title,
	glow,
	link,
	children,
}: {
	eyebrow: string;
	title: string;
	glow: string;
	link: ReactNode;
	children?: ReactNode;
}): ReactElement {
	return (
		<div className="tray">
			<div className="raised relative flex h-full min-h-44 flex-col justify-between gap-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card p-6">
				<span
					aria-hidden
					className={cn("pointer-events-none absolute size-56 rounded-full bg-(--glow) blur-3xl", glow)}
				/>
				<div className="relative flex flex-col gap-3">
					<p className="kicker">{eyebrow}</p>
					<h3 className="text-xl">{title}</h3>
					{children ? (
						<p className="max-w-reading text-fd-muted-foreground text-xs leading-relaxed">{children}</p>
					) : null}
				</div>
				<div className="relative">{link}</div>
			</div>
		</div>
	);
}
