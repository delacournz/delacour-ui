import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { TextInputInstance } from "react-native";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { HapticFeedback } from "../pressable";
import type { NumberInputConfig, NumberInputValue, StepResult } from "./number-input.format";
import type { NumberInputFieldOwnProps } from "./number-input.types";

/** What a custom part reads from the enclosing number input. */
export type NumberInputContextValue = {
	/** The committed value. `null` is empty. */
	value: NumberInputValue;
	/** The text being edited, or `null` when the field is not being edited. */
	draft: string | null;
	/** Whether a decrement would move the value. */
	canDecrement: boolean;
	/** Whether an increment would move the value. */
	canIncrement: boolean;
	/** Whether the field holds focus. */
	isFocused: boolean;
	variant: InputVariant;
	size: InputSize;
	isDisabled: boolean;
	isReadOnly: boolean;
	isInvalid: boolean;
	min: number;
	max: number;
	/**
	 * Steps the value once, `multiplier` steps long. A draft being edited is
	 * committed first, so the step starts from what was typed.
	 */
	stepBy: (direction: 1 | -1, multiplier?: number) => StepResult;
	/** Commits a value, reconciled onto the grid. */
	setValue: (next: NumberInputValue) => void;
};

/**
 * What the parts need beyond the public surface — the field's text plumbing and
 * the stepper's timing. Kept off {@link NumberInputContextValue} so a custom part
 * reading `useNumberInput()` sees only what it can sensibly use.
 */
export type NumberInputInternalContextValue = NumberInputContextValue & {
	config: NumberInputConfig;
	locale: string | undefined;
	/** What the field shows: the draft while editing, the formatted value at rest. */
	displayText: string;
	/** The value as an assistive technology reads it. */
	accessibilityText: string;
	accessibilityLabel: string | undefined;
	isEditable: boolean;
	placeholder: string | undefined;
	haptic: false | HapticFeedback;
	largeStepMultiplier: number;
	fieldRef: RefObject<TextInputInstance | null>;
	inputProps: NumberInputFieldOwnProps | undefined;
	onChangeText: (text: string) => void;
	onFocus: () => void;
	onBlur: () => void;
	onSubmit: () => void;
};

const NumberInputContext = createContext<NumberInputInternalContextValue | null>(null);

/**
 * Supplies one number input's value, bounds and handlers to its parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./number-input` and closing a cycle back through
 * the root. See AGENTS.md rule 3.
 */
export function NumberInputProvider({
	value,
	children,
}: {
	value: NumberInputInternalContextValue;
	children: ReactNode;
}): ReactElement {
	return <NumberInputContext value={value}>{children}</NumberInputContext>;
}
NumberInputProvider.displayName = "DelacourUI.NumberInput.Provider";

/** The enclosing number input's state, or null outside a `<NumberInput>`. */
export function useNumberInputContext(): NumberInputContextValue | null {
	return use(NumberInputContext);
}

/**
 * Reads the enclosing number input's value and state.
 *
 * For a custom part that has to match the input it sits in — a readout, a reset
 * button. Throws outside one; use {@link useNumberInputContext} where the input
 * is optional.
 */
export function useNumberInput(): NumberInputContextValue {
	const context = useNumberInputContext();
	if (!context) {
		throw new Error("useNumberInput must be called inside a <NumberInput>.");
	}
	return context;
}

/**
 * The enclosing number input's full context, for a part that cannot work
 * without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller wants
 * {@link useNumberInput}, whose error names the hook rather than a part.
 */
export function useNumberInputPart(component: string): NumberInputInternalContextValue {
	const context = use(NumberInputContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <NumberInput>.`);
	}
	return context;
}
