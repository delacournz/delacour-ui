import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A section's opening: the studio site's eyebrow — a 6px amber dot and a line
 * of tracked small capitals — then the heading, then an optional lede.
 *
 * The eyebrow is the studio's own mark for a section, measured off
 * `delacour.co.nz` and pinned by the brief, which is why it survives the craft
 * floor's general refusal of kickers: it is the world's device, not a habit.
 * Its text is part of the landing copy and is held verbatim by `copy.test.ts`.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }): ReactElement {
	return (
		<p
			className={cn(
				"inline-flex items-center gap-2 font-medium text-[13px] text-fd-muted-foreground uppercase tracking-eyebrow",
				className
			)}
		>
			<span aria-hidden className="size-1.5 rounded-full bg-fd-primary" />
			{children}
		</p>
	);
}

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
			<h2 className="text-3xl sm:text-4xl">{title}</h2>
			{children ? <p className="text-fd-muted-foreground text-lg">{children}</p> : null}
		</div>
	);
}
