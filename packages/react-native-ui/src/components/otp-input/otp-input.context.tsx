import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { OtpSlotState } from "./otp-input.logic";

export type OtpInputContextValue = {
	/** The sanitised code, unmasked. */
	value: string;
	/** How many cells. */
	length: number;
	isFocused: boolean;
	isMasked: boolean;
	isInvalid: boolean;
	isDisabled: boolean;
	size: InputSize;
	variant: InputVariant;
	/** One character drawn dimmed in an empty cell. */
	placeholder?: string;
	/** The cell drawn as focused, or `null` while the field is not focused. */
	activeIndex: number | null;
	/** Everything the cell at `index` needs to draw itself. */
	slot: (index: number) => OtpSlotState;
};

const OtpInputContext = createContext<OtpInputContextValue | null>(null);

/**
 * Supplies one code field's state to its cells.
 *
 * Lives in its own module, importing nothing but React and types, so a part can read it without
 * importing `./otp-input` and closing a cycle (AGENTS.md rule 3).
 */
export function OtpInputProvider({
	value,
	children,
}: {
	value: OtpInputContextValue;
	children: ReactNode;
}): ReactElement {
	return <OtpInputContext value={value}>{children}</OtpInputContext>;
}
OtpInputProvider.displayName = "DelacourUI.OtpInput.Provider";

/** The enclosing code field's state, or null outside an `<OtpInput>`. */
export function useOtpInputContext(): OtpInputContextValue | null {
	return use(OtpInputContext);
}

/**
 * Reads the enclosing code field's state.
 *
 * For a custom cell that has to match the field it sits in. Throws outside one — use
 * {@link useOtpInputContext} where the field is optional.
 */
export function useOtpInput(): OtpInputContextValue {
	const context = useOtpInputContext();
	if (!context) {
		throw new Error("useOtpInput must be called inside an <OtpInput>.");
	}
	return context;
}

/**
 * The enclosing code field's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useOtpInputPart(component: string): OtpInputContextValue {
	const context = useOtpInputContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside an <OtpInput>.`);
	}
	return context;
}
