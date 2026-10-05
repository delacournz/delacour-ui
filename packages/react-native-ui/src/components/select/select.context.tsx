import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { SelectOption, SelectSelectionMode } from "./select.types";

export type SelectContextValue = {
	/** Whether one option or several can be chosen. */
	selectionMode: SelectSelectionMode;
	/** The trigger's box, as Input names it. */
	variant: InputVariant;
	/** The trigger's height and type scale, and the rows' metrics. */
	size: InputSize;
	/** Whether the sheet is open. */
	isOpen: boolean;
	/** Whether the select is unavailable — own prop, then the enclosing `Field`. */
	isDisabled: boolean;
	/** Whether the select reports an invalid value — own prop, then the enclosing `Field`. */
	isInvalid: boolean;
	/** Shows its value and never opens. */
	isReadOnly: boolean;
	/** Options are on their way: the trigger shows a spinner. */
	isLoading: boolean;
	/** The chosen values, in the order they were chosen. Single mode holds at most one. */
	selectedValues: readonly string[];
	/** The options behind `selectedValues`. A value with no option is left out. */
	selectedOptions: readonly SelectOption[];
	/** What the trigger reads, or `undefined` while the placeholder shows. */
	triggerText: string | undefined;
	placeholder?: string;
	/** The accessible name: the enclosing `Field.Label`'s text, else the sheet title. */
	accessibilityLabel?: string;
	/** Custom trigger content for the current selection. */
	renderValue?: (selected: SelectOption[]) => ReactNode;
	/** Opens the sheet. Does nothing while disabled or read-only. */
	open: () => void;
	/** Closes the sheet and clears the search. */
	close: () => void;
	/** What a row press does: select, deselect, or refuse at the limit. */
	toggle: (value: string) => void;
	/** The root's `testID`, which the trigger wears. */
	testID?: string;
};

const SelectContext = createContext<SelectContextValue | null>(null);

/**
 * Supplies a select's state to its trigger and to any custom part.
 *
 * Lives in its own module, importing nothing but React and types, so
 * `select-trigger.tsx` can read it without importing `./select` and closing a
 * cycle back through the root. See AGENTS.md rule 3.
 */
export function SelectProvider({ value, children }: { value: SelectContextValue; children: ReactNode }): ReactElement {
	return <SelectContext value={value}>{children}</SelectContext>;
}
SelectProvider.displayName = "DelacourUI.Select.Provider";

/** The enclosing select's context, or null outside one. */
export function useSelectContext(): SelectContextValue | null {
	return use(SelectContext);
}

/**
 * Reads the enclosing select's state.
 *
 * For a custom trigger that has to match the select it sits in. Throws outside
 * one.
 */
export function useSelect(): SelectContextValue {
	const context = useSelectContext();
	if (!context) {
		throw new Error("useSelect must be called inside a <Select>.");
	}
	return context;
}

/**
 * The enclosing select's context, for a part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller wants
 * {@link useSelect}, whose error names the hook rather than a part.
 */
export function useSelectPart(component: string): SelectContextValue {
	const context = useSelectContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Select>.`);
	}
	return context;
}
