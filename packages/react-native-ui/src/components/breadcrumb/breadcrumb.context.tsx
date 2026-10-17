import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { BreadcrumbSize } from "./breadcrumb.variants";

export type BreadcrumbContextValue = {
	size: BreadcrumbSize;
	/** What every automatic separator draws in place of the chevron. Unset draws the chevron. */
	separator?: ReactNode;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

/**
 * Supplies the breadcrumb's size and separator to its parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./breadcrumb` — which would close a cycle and leave
 * the context `undefined` on a cold start. See AGENTS.md rule 3.
 */
export function BreadcrumbProvider({
	value,
	children,
}: {
	value: BreadcrumbContextValue;
	children: ReactNode;
}): ReactElement {
	return <BreadcrumbContext value={value}>{children}</BreadcrumbContext>;
}
BreadcrumbProvider.displayName = "DelacourUI.Breadcrumb.Provider";

/** The enclosing breadcrumb's context, or null outside a `<Breadcrumb>`. */
export function useBreadcrumbContext(): BreadcrumbContextValue | null {
	return use(BreadcrumbContext);
}

/**
 * Reads the enclosing breadcrumb's size and separator.
 *
 * For a custom crumb — a menu trigger, a badge — that has to match the trail it
 * sits in. Throws outside one.
 */
export function useBreadcrumb(): BreadcrumbContextValue {
	const context = useBreadcrumbContext();
	if (!context) {
		throw new Error("useBreadcrumb must be called inside a <Breadcrumb>.");
	}
	return context;
}

/**
 * The enclosing breadcrumb, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller wants {@link useBreadcrumb},
 * whose error names the hook rather than a part.
 */
export function useBreadcrumbPart(component: string): BreadcrumbContextValue {
	const context = useBreadcrumbContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Breadcrumb>.`);
	}
	return context;
}
