import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ToastStatus } from "./toast.store";

/** The action `Toast.Action` lends its root, so a screen reader's `activate` runs it. */
export type ToastRegisteredAction = {
	label: string;
	run: () => void;
};

export type ToastContextValue = {
	status: ToastStatus;
	/** Hides the toast — the root's `onHide`, or the viewport's for the toast it is drawing. */
	hide: () => void;
	/** `Toast.Action` registers itself here while mounted, and passes `null` on unmount. */
	registerAction: (action: ToastRegisteredAction | null) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Supplies the enclosing toast's status and `hide` to its parts.
 *
 * Its own module, importing nothing but types, so a part can read it without
 * importing `./toast` — that import would close a cycle (package rule 3).
 */
export function ToastProvider({ value, children }: { value: ToastContextValue; children: ReactNode }): ReactElement {
	return <ToastContext value={value}>{children}</ToastContext>;
}
ToastProvider.displayName = "DelacourUI.Toast.Provider";

/** The enclosing toast's context, or null outside a `<Toast>`. */
export function useToastContext(): ToastContextValue | null {
	return use(ToastContext);
}

/** Internal: the enclosing toast's context for a part that cannot work without one. */
export function useToastPart(component: string): ToastContextValue {
	const context = useToastContext();
	if (!context) throw new Error(`${component} must be rendered inside a <Toast>.`);
	return context;
}

/** What the viewport tells a toast it is drawing: which one, and how to hide it. */
export type ToastItemContextValue = {
	id: string;
	hide: () => void;
};

const ToastItemContext = createContext<ToastItemContextValue | null>(null);

/**
 * Wraps each toast the viewport draws, so a `<Toast>` inside a custom
 * `render` hides the right toast with no `onHide` of its own.
 */
export function ToastItemProvider({
	value,
	children,
}: {
	value: ToastItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <ToastItemContext value={value}>{children}</ToastItemContext>;
}
ToastItemProvider.displayName = "DelacourUI.ToastViewport.ItemProvider";

/** The toast the viewport is drawing here, or null outside one. */
export function useToastItemContext(): ToastItemContextValue | null {
	return use(ToastItemContext);
}
