import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The phone bezel a whole-screen capture sits in.
 *
 * One component, shared by the landing hero and every `device` preview on a
 * component page, so the two cannot drift: the same corner, the same hairline,
 * the same lift. The outer corner is the studio's card radius scaled to a
 * phone; the inner one is what remains once the bezel's padding is taken off.
 *
 * The shadow is real depth — an offset and a wide, soft blur — rather than a
 * halo. `--shadow` is mixed from the foreground in light and from the page in
 * dark, so it darkens under the phone in both rather than glowing.
 */
export function DeviceBezel({ children, className }: { children: ReactNode; className?: string }): ReactElement {
	return (
		<div
			className={cn(
				"group/preview rounded-[2.5rem] border border-fd-border bg-fd-card p-[6px] shadow-[0_24px_48px_-20px_var(--shadow)]",
				className
			)}
		>
			<div className="overflow-hidden rounded-[2.1rem]">{children}</div>
		</div>
	);
}
