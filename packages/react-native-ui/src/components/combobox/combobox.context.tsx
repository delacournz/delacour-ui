import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ChipVariant } from "../chip/chip.variants";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { SelectOption } from "../select/select.types";
import type { ComboboxSelectionMode } from "./combobox.types";

export type ComboboxContextValue = {
	/** Whether one option or several can be chosen. */
	selectionMode: ComboboxSelectionMode;
	/** The trigger's box, as Input names it. */
	variant: InputVariant;
	/** The trigger's height and type scale, and the rows' metrics. */
	size: InputSize;
	/** Whether the sheet is open. */
	isOpen: boolean;
	/** Whether the combobox is unavailable — own prop, then the enclosing `Field`. */
	isDisabled: boolean;
	/** Whether the combobox reports an invalid value — own prop, then the enclosing `Field`. */
	isInvalid: boolean;
	/** Shows its value, chips without remove buttons, and never opens. */
	isReadOnly: boolean;
	/** Results are on their way. */
	isLoading: boolean;
	/** The trigger offers a button that clears the value. */
	isClearable: boolean;
	/** The chosen values, in the order they were chosen. Single mode holds at most one. */
	selectedValues: readonly string[];
	/** The options behind `selectedValues` — remembered ones and custom values included. */
	selectedOptions: readonly SelectOption[];
	/** What the trigger announces, or `undefined` while the placeholder shows. */
	triggerText: string | undefined;
	placeholder?: string;
	/** The accessible name: the enclosing `Field.Label`'s text, else the sheet title. */
	accessibilityLabel?: string;
	/** The query typed into the sheet's search field. */
	inputValue: string;
	/** How the trigger's chips are painted. */
	chipVariant: ChipVariant;
	/** How many chips the trigger draws before a `+N`. */
	maxVisibleChips?: number;
	/** Opens the sheet. Does nothing while disabled or read-only. */
	open: () => void;
	/** Closes the sheet and clears the query. */
	close: () => void;
	/** What a row press does: select, deselect, or refuse at the limit. */
	toggle: (value: string) => void;
	/** Takes one value out of the selection — a chip's remove. */
	remove: (value: string) => void;
	/** Empties the selection. */
	clear: () => void;
	/** The root's `testID`, which the trigger wears. */
	testID?: string;
};

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

/**
 * Supplies a combobox's state to its trigger and to any custom part.
 *
 * Lives in its own module, importing nothing but React and types, so
 * `combobox-trigger.tsx` can read it without importing `./combobox` and closing
 * a cycle back through the root. See AGENTS.md rule 3.
 */
export function ComboboxProvider({
	value,
	children,
}: {
	value: ComboboxContextValue;
	children: ReactNode;
}): ReactElement {
	return <ComboboxContext value={value}>{children}</ComboboxContext>;
}
ComboboxProvider.displayName = "DelacourUI.Combobox.Provider";

/** The enclosing combobox's context, or null outside one. */
export function useComboboxContext(): ComboboxContextValue | null {
	return use(ComboboxContext);
}

/**
 * Reads the enclosing combobox's state.
 *
 * For a custom trigger that has to match the combobox it sits in. Throws
 * outside one.
 */
export function useCombobox(): ComboboxContextValue {
	const context = useComboboxContext();
	if (!context) {
		throw new Error("useCombobox must be called inside a <Combobox>.");
	}
	return context;
}

/**
 * The enclosing combobox's context, for a part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller wants
 * {@link useCombobox}, whose error names the hook rather than a part.
 */
export function useComboboxPart(component: string): ComboboxContextValue {
	const context = useComboboxContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Combobox>.`);
	}
	return context;
}
