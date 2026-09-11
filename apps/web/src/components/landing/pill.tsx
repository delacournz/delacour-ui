import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The site's two calls to action, as the studio site draws them: a fully
 * round pill, 14/500, `10px 20px`. The primary is amber with the card colour
 * for text; the ghost is a hairline on the page. The amber one carries a soft,
 * offset shadow mixed from itself on hover — the only place the site glows.
 */
export const PILL =
	"inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-medium text-sm transition";

export const PILL_PRIMARY = cn(
	PILL,
	"bg-fd-primary text-fd-primary-foreground hover:shadow-[0_8px_24px_-8px_var(--glow)] hover:brightness-105"
);

export const PILL_GHOST = cn(PILL, "border border-fd-border bg-fd-card/60 text-fd-foreground hover:bg-fd-accent");

type PillLinkProps = Pick<LinkProps, "to" | "params" | "search"> & {
	variant?: "primary" | "ghost";
	className?: string;
	children: ReactNode;
};

export function PillLink({ variant = "primary", className, children, ...link }: PillLinkProps): ReactElement {
	return (
		<Link className={cn(variant === "primary" ? PILL_PRIMARY : PILL_GHOST, className)} {...link}>
			{children}
		</Link>
	);
}

/** An in-line "→" link in the site's muted voice, brightening on hover. */
export const ARROW_LINK =
	"inline-flex items-center gap-1 font-medium text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground";
