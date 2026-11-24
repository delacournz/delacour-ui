import { Check, Minus, X } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import type { Support } from "@/lib/comparison";

/**
 * The mark, and the word for it — both, always. An icon alone is invisible to
 * a screen reader and ambiguous in a monochrome print or a high-contrast mode.
 *
 * Ink and hairline rather than the accent: see the route's own note on the One
 * Amber Rule.
 */
export function Mark({ support }: { support: Support }): ReactElement {
	const shell = "inline-flex size-5 shrink-0 items-center justify-center rounded-full";

	if (support === "yes") {
		return (
			<span className={cn(shell, "bg-fd-foreground text-fd-background")}>
				<Check aria-hidden className="size-3.5" strokeWidth={3} />
				<span className="sr-only">Yes</span>
			</span>
		);
	}

	if (support === "partial") {
		return (
			<span className={cn(shell, "border border-fd-border bg-fd-muted text-fd-muted-foreground")}>
				<Minus aria-hidden className="size-3.5" strokeWidth={3} />
				<span className="sr-only">Partly</span>
			</span>
		);
	}

	return (
		<span className={cn(shell, "border border-fd-border text-fd-muted-foreground")}>
			<X aria-hidden className="size-3.5" strokeWidth={3} />
			<span className="sr-only">No</span>
		</span>
	);
}
