import { type ComponentProps, type ElementType, type ReactElement, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The site's one motion moment: a section fades and lifts into place as it
 * enters the viewport.
 *
 * The rules that keep it honest, each of which is a way this pattern usually
 * goes wrong:
 *
 * - **Nothing is hidden in the server HTML.** The attribute that hides a
 *   section is written on mount, and only onto sections that are below the
 *   fold at that moment. With scripting off every section is visible; with it
 *   on, what was already on screen never blinks.
 * - **Reduced motion is CSS, not a hook.** `app.css` disables the transition
 *   and the offset under `prefers-reduced-motion: reduce`, so the observer
 *   still runs and still marks sections in; they simply appear.
 * - **One system.** Every section goes through this wrapper and the timing
 *   lives in one rule, so there is no second entrance effect to disagree with
 *   it and nothing hovers, bounces or parallaxes on its own.
 */
type RevealProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, "as">;

export function Reveal<T extends ElementType = "section">({ as, className, ...props }: RevealProps<T>): ReactElement {
	const Tag: ElementType = as ?? "section";
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		if (element.getBoundingClientRect().top >= window.innerHeight) {
			element.dataset.reveal = "out";
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				element.dataset.reveal = "in";
				observer.disconnect();
			},
			{ rootMargin: "0px 0px -10% 0px" }
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return <Tag className={cn("reveal", className)} ref={ref} {...props} />;
}
