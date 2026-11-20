import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { AlertSize, AlertStatus, AlertVariant } from "./alert.variants";

export type AlertContextValue = {
	/** What the alert says about the thing it describes. */
	status: AlertStatus;
	/** How the alert's surface is painted. */
	variant: AlertVariant;
	/** Size of the alert. */
	size: AlertSize;
	/**
	 * Closes the alert — hides it when uncontrolled, and reports `false` through
	 * `onOpenChange` either way. Lets an action inside the alert ("Got it")
	 * dismiss it without the caller threading a setter down.
	 */
	dismiss: () => void;
	/**
	 * Tells the alert what a part says, so the alert can speak it. `Title` and `Description` call this
	 * with their text and clear it on unmount; a dismissed alert's parts unmount, so re-opening it
	 * registers them again and the alert is heard again.
	 */
	registerText: (part: AlertTextPart, text: string) => void;
};

/** The parts whose text the alert speaks. */
export type AlertTextPart = "title" | "description";

const AlertContext = createContext<AlertContextValue | null>(null);

/**
 * Supplies the enclosing alert's status, variant, size and `dismiss` to its
 * subtree.
 *
 * Lives in its own module, importing nothing but `alert.variants`, so a part
 * can read it without importing `./alert`. That import would close a cycle, and
 * Metro serves a partially initialised module for a cycle — leaving the context
 * `undefined` at import time and red-boxing the app on a cold start.
 */
export function AlertProvider({ value, children }: { value: AlertContextValue; children: ReactNode }): ReactElement {
	return <AlertContext value={value}>{children}</AlertContext>;
}
AlertProvider.displayName = "DelacourUI.Alert.Provider";

/** The enclosing alert's context, or null outside an `<Alert>`. */
export function useAlertContext(): AlertContextValue | null {
	return use(AlertContext);
}

/**
 * Reads the enclosing alert's status, variant, size and `dismiss`.
 *
 * Lets a custom child match the alert — or close it — without the alert passing
 * props down. Throws outside an `<Alert>`; use {@link useAlertContext} where the
 * enclosing alert is optional.
 */
export function useAlert(): AlertContextValue {
	const context = useAlertContext();
	if (!context) {
		throw new Error("useAlert must be called inside an <Alert>.");
	}
	return context;
}

/**
 * The enclosing alert's context, for a compound part that cannot work without
 * one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useAlert}, whose error message names the hook rather than
 * a part.
 */
export function useAlertPart(component: string): AlertContextValue {
	const context = useAlertContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside an <Alert>.`);
	}
	return context;
}
