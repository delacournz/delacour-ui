import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The site's two calls to action, as the language draws a control: a h-9
 * rounded-lg, 13px, pressing to .97. The primary is the greyscale primary with
 * the 16% inner highlight; the ghost is a hairline on the page that fills with
 * 4% foreground on hover. Nothing glows — colour is for status and charts.
 */
export const PILL =
	"inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 font-medium text-[13px] transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";

export const PILL_PRIMARY = cn(
	PILL,
	"bg-fd-primary text-fd-primary-foreground shadow-(--highlight-primary) hover:bg-fd-primary/90"
);

export const PILL_GHOST = cn(
	PILL,
	"raised border border-fd-border bg-fd-card text-fd-foreground hover:bg-(--hover-fill)"
);

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
	"inline-flex items-center gap-1 text-fd-muted-foreground text-xs transition-colors duration-150 ease-out hover:text-fd-foreground";
