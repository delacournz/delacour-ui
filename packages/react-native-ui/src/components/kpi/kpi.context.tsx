import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { KpiColorIndex, KpiGoodDirection, KpiGroupOrientation, KpiLayout, KpiSize } from "./kpi.variants";

export type KpiContextValue = {
	/** The card's size — the inset, the value's scale and the sparkline's height. */
	size: KpiSize;
	/** Which `--chart-*` token the sparkline and the icon take. */
	colorIndex: KpiColorIndex;
	/** Which way is the good news, for every trend inside that does not override it. */
	goodDirection: KpiGoodDirection;
	/** Whether the numbers are still on their way. The value, trend and sparkline hold placeholders. */
	isLoading: boolean;
	/**
	 * The sparkline point being scrubbed, or `null` when nothing is. A custom
	 * part reads it to print that point's value in place of the latest one.
	 */
	activeIndex: number | null;
	/** Moves the scrubbed point. The sparkline calls it; a caller holding the state may too. */
	setActiveIndex: (index: number | null) => void;
};

const KpiContext = createContext<KpiContextValue | null>(null);

/**
 * Supplies the enclosing KPI's size, colour, direction and scrub to its subtree.
 *
 * Lives in its own module, importing nothing but types, so a part the KPI
 * renders can read it without importing `./kpi` and closing a cycle through
 * `kpi.tsx`. See AGENTS.md rule 3.
 */
export function KpiProvider({ value, children }: { value: KpiContextValue; children: ReactNode }): ReactElement {
	return <KpiContext value={value}>{children}</KpiContext>;
}
KpiProvider.displayName = "DelacourUI.Kpi.Provider";

/** The enclosing KPI's context, or null outside a `<Kpi>`. */
export function useKpiContext(): KpiContextValue | null {
	return use(KpiContext);
}

/**
 * Reads the enclosing KPI's size, colour, direction, loading state and scrub.
 *
 * What a custom part uses to print the scrubbed point's value, match the
 * card's series colour, or hold a placeholder while it loads. Throws outside a
 * `<Kpi>`; use {@link useKpiContext} where the enclosing KPI is optional.
 */
export function useKpi(): KpiContextValue {
	const context = useKpiContext();
	if (!context) {
		throw new Error("useKpi must be called inside a <Kpi>.");
	}
	return context;
}

/**
 * The enclosing KPI's context, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useKpi}, whose error message names the hook rather than
 * a part.
 */
export function useKpiPart(component: string): KpiContextValue {
	const context = useKpiContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Kpi>.`);
	}
	return context;
}

const KpiLayoutContext = createContext<KpiLayout>("below");

/**
 * Supplies `Kpi.Content`'s layout to the stat and the sparkline inside it —
 * the stat takes the row's width and the sparkline a fixed column when it is
 * `inline`.
 */
export function KpiLayoutProvider({ value, children }: { value: KpiLayout; children: ReactNode }): ReactElement {
	return <KpiLayoutContext value={value}>{children}</KpiLayoutContext>;
}
KpiLayoutProvider.displayName = "DelacourUI.Kpi.Content.Provider";

/** The enclosing `Kpi.Content`'s layout — `below` outside one. */
export function useKpiLayout(): KpiLayout {
	return use(KpiLayoutContext);
}

export type KpiGroupContextValue = {
	orientation: KpiGroupOrientation;
	/** Whether the metrics share one surface with a rule between them. */
	separated: boolean;
};

const KpiGroupContext = createContext<KpiGroupContextValue | null>(null);

/** Supplies a `Kpi.Group`'s arrangement to the metrics inside it. */
export function KpiGroupProvider({
	value,
	children,
}: {
	value: KpiGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <KpiGroupContext value={value}>{children}</KpiGroupContext>;
}
KpiGroupProvider.displayName = "DelacourUI.Kpi.Group.Provider";

/** The enclosing `Kpi.Group`, or null outside one. */
export function useKpiGroupContext(): KpiGroupContextValue | null {
	return use(KpiGroupContext);
}
