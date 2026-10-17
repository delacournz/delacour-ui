import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { HapticFeedback } from "../pressable/pressable";
import type { PaginationSize, PaginationToken, PaginationVariant } from "./pagination.variants";

export type PaginationContextValue = {
	/** The current page, one-based and already clamped into `[1, max(1, count)]`. */
	page: number;
	/** Total pages. */
	count: number;
	/** The run the `numbers` variant draws — fixed length once `count` outgrows it. */
	range: PaginationToken[];
	/** Moves to a page, clamped. Quiet for the current page and while disabled. */
	select: (page: number) => void;
	canPrevious: boolean;
	canNext: boolean;
	variant: PaginationVariant;
	size: PaginationSize;
	/** Pages an ellipsis jumps. */
	pageJump: number;
	isDisabled: boolean;
	/** The haptic every target plays unless it names its own. */
	haptic: false | HapticFeedback;
	/** The root's accessible name, which the compact readout reuses. */
	accessibilityLabel: string;
};

const PaginationContext = createContext<PaginationContextValue | null>(null);

/**
 * Supplies the page, the count and the axes to every part.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./pagination` — which would close a cycle and leave
 * the context `undefined` on a cold start. See AGENTS.md rule 3.
 */
export function PaginationProvider({
	value,
	children,
}: {
	value: PaginationContextValue;
	children: ReactNode;
}): ReactElement {
	return <PaginationContext value={value}>{children}</PaginationContext>;
}
PaginationProvider.displayName = "DelacourUI.Pagination.Provider";

/** The enclosing pagination's context, or null outside a `<Pagination>`. */
export function usePaginationContext(): PaginationContextValue | null {
	return use(PaginationContext);
}

/**
 * Reads the enclosing pagination — its page, count, run and `select`.
 *
 * For a custom part — a "jump to page" field, a page-size picker — that has to
 * agree with the pagination it sits in. Throws outside one.
 */
export function usePagination(): PaginationContextValue {
	const context = usePaginationContext();
	if (!context) {
		throw new Error("usePagination must be called inside a <Pagination>.");
	}
	return context;
}

/**
 * The enclosing pagination, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller wants {@link usePagination},
 * whose error names the hook rather than a part.
 */
export function usePaginationPart(component: string): PaginationContextValue {
	const context = usePaginationContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Pagination>.`);
	}
	return context;
}
