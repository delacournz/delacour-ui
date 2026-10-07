import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A section's opening: a tracked mono-caps kicker — 10px, 0.22em — with a
 * small hairline mark before it, then the heading, then an optional lede.
 *
 * The kicker is the language's own device for a section, set by the brief,
 * which is why it survives the craft floor's general refusal of eyebrows: it is
 * the world's mark, not a habit. Its text is part of the landing copy and is
 * held verbatim by `copy.test.ts`.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }): ReactElement {
	return (
		<p className={cn("kicker inline-flex items-center gap-2.5", className)}>
			<span aria-hidden className="h-px w-4 bg-fd-foreground/40" />
			{children}
		</p>
	);
}

/**
 * The heading block: eyebrow, title, and an optional lede capped at the
 * reading measure. The cap is here rather than at each call site because the
 * section around it is always the full `PAGE_SECTION` — a lede that inherits
 * 72rem is one line of prose 1100px wide.
 */
export function SectionHeading({
	eyebrow,
	title,
	children,
	className,
}: {
	eyebrow: string;
	title: string;
	children?: ReactNode;
	className?: string;
}): ReactElement {
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<Eyebrow>{eyebrow}</Eyebrow>
			<h2 className="text-2xl sm:text-3xl">{title}</h2>
			{children ? <p className="max-w-reading text-fd-muted-foreground text-sm">{children}</p> : null}
		</div>
	);
}
