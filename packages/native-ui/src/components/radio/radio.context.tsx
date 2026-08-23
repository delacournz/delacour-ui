import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { RadioOrientation, RadioSize, RadioVariant } from "./radio.variants";

export type RadioGroupContextValue = {
	/** The selected radio's value. `null` is "nothing selected", never `undefined`. */
	selected: string | null;
	/** What a radio calls on press. Stays quiet when the value is already selected. */
	select: (value: string) => void;
	/** Size of every radio in the group. The group owns this axis outright. */
	size: RadioSize;
	/** How every ring in the group is painted. The group owns this axis outright. */
	variant: RadioVariant;
	/** Which way the group lays its radios out. */
	orientation: RadioOrientation;
	/**
	 * Raw rather than resolved, and deliberately so.
	 *
	 * `Input.Group` publishes these settled because it draws a box whose state it
	 * has to paint. A radio group paints nothing, and it holds many radios — so
	 * leaving `undefined` to mean "the group said nothing" is what lets a single
	 * option disable itself. A group that does name the axis still wins outright.
	 */
	isDisabled?: boolean;
	isInvalid?: boolean;
};

export type RadioContextValue = {
	/** Size of the radio, already settled from group, own props and field. */
	size: RadioSize;
	/** How the ring is painted, already settled. */
	variant: RadioVariant;
	/** Whether this radio is the selection. */
	isSelected: boolean;
	/** Whether this radio is unavailable. */
	isDisabled: boolean;
	/** Whether this radio reports an invalid value. */
	isInvalid: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
const RadioContext = createContext<RadioContextValue | null>(null);

/**
 * Supplies the enclosing group's selection and axes to the radios inside it.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./radio` or `./radio-group`. That import would close
 * a cycle, and Metro serves a partially initialised module for a cycle — leaving
 * the context `undefined` at import time and red-boxing the app on a cold start.
 */
export function RadioGroupProvider({
	value,
	children,
}: {
	value: RadioGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <RadioGroupContext value={value}>{children}</RadioGroupContext>;
}
RadioGroupProvider.displayName = "DelacourUI.Radio.Group.Provider";

/**
 * Supplies one radio's settled state to its own parts.
 *
 * What the parts read is always the *resolved* state, so `Radio.Indicator` never
 * has to know whether it is inside a group, never reads a `Field`, and never
 * imports the root.
 */
export function RadioProvider({ value, children }: { value: RadioContextValue; children: ReactNode }): ReactElement {
	return <RadioContext value={value}>{children}</RadioContext>;
}
RadioProvider.displayName = "DelacourUI.Radio.Provider";

/**
 * The enclosing group's context, or null outside a `<Radio.Group>`.
 *
 * This is the export the radio root reads: it is nullable because a radio has to
 * work perfectly well on its own, the same way `useFieldContext` is nullable for
 * every control that can stand outside a `Field`.
 */
export function useRadioGroupContext(): RadioGroupContextValue | null {
	return use(RadioGroupContext);
}

/**
 * Reads the enclosing group's selection and axes.
 *
 * For a custom control that has to match the group it sits in. Throws outside
 * one — use {@link useRadioGroupContext} where the group is optional.
 */
export function useRadioGroup(): RadioGroupContextValue {
	const context = useRadioGroupContext();
	if (!context) {
		throw new Error("useRadioGroup must be called inside a <Radio.Group>.");
	}
	return context;
}

/** The enclosing radio's settled state, or null outside a `<Radio>`. */
export function useRadioContext(): RadioContextValue | null {
	return use(RadioContext);
}

/**
 * Reads the enclosing radio's settled state.
 *
 * Lets a custom child style itself to match without the radio having to pass
 * props down through every slot. Throws outside a `<Radio>` — use
 * {@link useRadioContext} where the enclosing radio is optional.
 */
export function useRadio(): RadioContextValue {
	const context = useRadioContext();
	if (!context) {
		throw new Error("useRadio must be called inside a <Radio>.");
	}
	return context;
}

/**
 * The enclosing radio's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useRadio}, whose error message names the hook rather than
 * a part.
 */
export function useRadioPart(component: string): RadioContextValue {
	const context = useRadioContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Radio>.`);
	}
	return context;
}
