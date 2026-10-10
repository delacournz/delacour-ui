import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SelectionModeState } from "./selection-mode.types";
import type { SelectionIndicator } from "./selection-mode.variants";

export type SelectionModeContextValue = SelectionModeState;

const SelectionModeContext = createContext<SelectionModeContextValue | null>(null);

/**
 * Supplies a selection to every part beneath it.
 *
 * In a leaf of its own, importing nothing but types, so a part can read it
 * without importing `./selection-mode` and closing a cycle (package AGENTS.md
 * rule 3).
 */
export function SelectionModeProvider({
	value,
	children,
}: {
	value: SelectionModeContextValue;
	children: ReactNode;
}): ReactElement {
	return <SelectionModeContext value={value}>{children}</SelectionModeContext>;
}
SelectionModeProvider.displayName = "DelacourUI.SelectionMode.Provider";

/** The enclosing selection, or null outside a `<SelectionMode>`. */
export function useSelectionModeContext(): SelectionModeContextValue | null {
	return use(SelectionModeContext);
}

/**
 * Reads the enclosing selection: whether the mode is on, what is picked, and
 * the actions that move it.
 *
 * For a custom child — an item drawn with `indicator="none"` that paints its own
 * picked state, a toolbar of its own. Throws outside a `<SelectionMode>` — use
 * {@link useSelectionModeContext} where the selection is optional.
 */
export function useSelectionMode(): SelectionModeContextValue {
	const context = useSelectionModeContext();
	if (!context) {
		throw new Error("useSelectionMode must be called inside a <SelectionMode>.");
	}
	return context;
}

/**
 * The enclosing selection, for a compound part that cannot work without it.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useSelectionModePart(component: string): SelectionModeContextValue {
	const context = useSelectionModeContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <SelectionMode>.`);
	}
	return context;
}

export type SelectionModeItemContextValue = {
	/** The item's id. */
	value: string;
	/** Whether it is picked. */
	isSelected: boolean;
	/** Whether it can be picked at all. */
	isDisabled: boolean;
	/** How it shows it is picked. */
	indicator: SelectionIndicator;
};

const SelectionModeItemContext = createContext<SelectionModeItemContextValue | null>(null);

/** Supplies one item's id and state, so a `SelectionMode.Indicator` inside it needs no `value`. */
export function SelectionModeItemProvider({
	value,
	children,
}: {
	value: SelectionModeItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <SelectionModeItemContext value={value}>{children}</SelectionModeItemContext>;
}
SelectionModeItemProvider.displayName = "DelacourUI.SelectionMode.Item.Provider";

/** The enclosing item, or null outside a `<SelectionMode.Item>`. */
export function useSelectionModeItemContext(): SelectionModeItemContextValue | null {
	return use(SelectionModeItemContext);
}
