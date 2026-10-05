import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SupportAvailability } from "./support.types";

export type SupportContextValue = {
	/** Whether anyone is there to answer — decided once, on the root. */
	availability: SupportAvailability;
};

export type SupportTopicsContextValue = {
	/** The selected topic, or `null` before one is picked. */
	value: string | null;
	/** Selects a topic. A disabled one is ignored; the selected one stays selected. */
	select: (value: string) => void;
	/** Records whether a topic is disabled, so `select` can refuse it even when called by hand. */
	registerDisabled: (value: string, isDisabled: boolean) => void;
};

/** What `useSupport()` returns outside a `<Support>` — a thread route that mounts no root. */
const DEFAULT_SUPPORT: SupportContextValue = { availability: "offline" };

const SupportContext = createContext<SupportContextValue | null>(null);
const SupportTopicsContext = createContext<SupportTopicsContextValue | null>(null);

/**
 * Supplies the root's availability to `Support.Status`, `Support.Agent` and `Support.Note`.
 *
 * Lives in its own module, importing nothing but types, so a part can read it without importing
 * `./support` and closing a cycle through the root. See AGENTS.md rule 3.
 */
export function SupportProvider({ value, children }: { value: SupportContextValue; children: ReactNode }): ReactElement {
	return <SupportContext value={value}>{children}</SupportContext>;
}
SupportProvider.displayName = "DelacourUI.Support.Provider";

/** The enclosing help section's context, or null outside a `<Support>`. */
export function useSupportContext(): SupportContextValue | null {
	return use(SupportContext);
}

/**
 * Reads the enclosing help section's availability.
 *
 * **Never throws** — the one deliberate departure from the library's throw-outside-root rule.
 * Outside a `<Support>` it returns `{ availability: "offline" }`, so `Support.Agent` and
 * `Support.Note` work on a thread route that never mounts a root, instead of that route needing a
 * dummy one.
 */
export function useSupport(): SupportContextValue {
	return useSupportContext() ?? DEFAULT_SUPPORT;
}

/** Supplies a `Support.Topics` group's selection to its topics. */
export function SupportTopicsProvider({
	value,
	children,
}: {
	value: SupportTopicsContextValue;
	children: ReactNode;
}): ReactElement {
	return <SupportTopicsContext value={value}>{children}</SupportTopicsContext>;
}
SupportTopicsProvider.displayName = "DelacourUI.Support.Topics.Provider";

/**
 * The enclosing topic group's selection and its `select`, so a custom topic row can match the
 * built-in one. Throws outside a `<Support.Topics>` — a topic with no group has no queue to pick.
 */
export function useSupportTopics(): SupportTopicsContextValue {
	const context = use(SupportTopicsContext);
	if (!context) {
		throw new Error("useSupportTopics must be called inside a <Support.Topics>.");
	}
	return context;
}
