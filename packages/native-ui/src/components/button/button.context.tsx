import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ButtonSize, ButtonVariant } from "./button.variants";

export type ButtonContextValue = {
	/** Size of the button. */
	size: ButtonSize;
	/** Visual variant of the button. */
	variant: ButtonVariant;
	/** Whether the button is disabled. */
	isDisabled: boolean;
	/** Whether the button has work in flight. */
	isLoading: boolean;
};

const ButtonContext = createContext<ButtonContextValue | null>(null);

/**
 * Supplies the enclosing button's variant, size and state to its subtree.
 *
 * Lives in its own module, importing nothing but `button.variants`, so a
 * component the button itself renders — `Spinner` — can read it without
 * importing `../button`. That import would close a cycle through
 * `button.tsx`, and Metro serves a partially initialised module for a cycle,
 * leaving the context `undefined` at import time.
 */
export function ButtonProvider({ value, children }: { value: ButtonContextValue; children: ReactNode }): ReactElement {
	return <ButtonContext value={value}>{children}</ButtonContext>;
}
ButtonProvider.displayName = "DelacourUI.Button.Provider";

/** The enclosing button's context, or null outside a `<Button>`. */
export function useButtonContext(): ButtonContextValue | null {
	return use(ButtonContext);
}

/**
 * Reads the enclosing button's variant, size and state.
 *
 * Lets a custom child style itself to match without the button having to pass
 * props down through every slot. Throws outside a `<Button>` — use
 * {@link useButtonContext} where the enclosing button is optional.
 */
export function useButton(): ButtonContextValue {
	const context = useButtonContext();
	if (!context) {
		throw new Error("useButton must be called inside a <Button>.");
	}
	return context;
}

/**
 * The enclosing button's context, for a compound part that cannot work without
 * one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useButton}, whose error message names the hook rather
 * than a part.
 */
export function useButtonPart(component: string): ButtonContextValue {
	const context = useButtonContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Button>.`);
	}
	return context;
}
