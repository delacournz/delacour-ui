import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and resolves Tailwind conflicts so the last utility wins.
 *
 * Uniwind does not deduplicate conflicting classes on its own — both would be
 * applied and the winner would be undefined. Always route a caller-supplied
 * `className` through this before handing it to a component.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
