import { Children, isValidElement, type ReactNode } from "react";
import { BadgeLabel } from "./badge-label";

/**
 * The text a badge's children spell: bare strings and numbers, and the children
 * of any `Badge.Label`, joined with a space. Empty when there is none (an icon-only
 * badge), so the dismiss control keeps its bare name.
 */
export function badgeLabelText(children: ReactNode): string | undefined {
	const parts: string[] = [];
	let run = "";
	const flush = () => {
		if (run.trim()) parts.push(run.trim());
		run = "";
	};
	for (const child of Children.toArray(children)) {
		if (typeof child === "string" || typeof child === "number") {
			run += String(child);
			continue;
		}
		flush();
		if (isValidElement<{ children?: ReactNode }>(child) && child.type === BadgeLabel) {
			const nested = badgeLabelText(child.props.children);
			if (nested) parts.push(nested);
		}
	}
	flush();
	return parts.length > 0 ? parts.join(" ") : undefined;
}
