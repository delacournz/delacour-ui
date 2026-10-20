import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { TourStepEntry } from "./tour.types";

/** What `useTour()` returns: where the tour is and the actions that move it. */
export type TourContextValue = {
	isOpen: boolean;
	/** The `order` of the step on screen — the lowest order while nothing has been chosen. */
	step: number | undefined;
	/** The step's position among the registered steps, zero-based. -1 with no steps. */
	index: number;
	/** How many steps are registered. */
	total: number;
	/** Opens the tour, at `step` or at the first step. */
	start: (step?: number) => void;
	/** Moves to the next step, or finishes on the last. */
	next: () => void;
	/** Moves to the previous step. Does nothing on the first. */
	back: () => void;
	/** Closes the tour and calls `onSkip`. */
	skip: () => void;
	/** Closes the tour and calls `onFinish`. */
	finish: () => void;
	/** Moves to the step with this `order`. Ignored when no step has it. */
	goTo: (order: number) => void;
};

/** How a `Tour.Step` reaches its tour. Stable for the tour's lifetime, so steps never re-render on a move. */
export type TourRegistryValue = {
	/** Adds or replaces a step; the returned function removes it. */
	register: (entry: TourStepEntry) => () => void;
};

const TourContext = createContext<TourContextValue | null>(null);
const TourRegistryContext = createContext<TourRegistryValue | null>(null);

/**
 * Supplies the tour's state and actions.
 *
 * Lives in its own module, importing nothing but React and types, so a part can read it without
 * importing `./tour` — which would close a cycle. See AGENTS.md rule 3.
 */
export function TourProvider({ value, children }: { value: TourContextValue; children: ReactNode }): ReactElement {
	return <TourContext value={value}>{children}</TourContext>;
}
TourProvider.displayName = "DelacourUI.Tour.Provider";

/** Supplies the step registry. Split from the state so a move re-renders no step. */
export function TourRegistryProvider({
	value,
	children,
}: {
	value: TourRegistryValue;
	children: ReactNode;
}): ReactElement {
	return <TourRegistryContext value={value}>{children}</TourRegistryContext>;
}
TourRegistryProvider.displayName = "DelacourUI.Tour.RegistryProvider";

/** The enclosing tour, or null outside a `<Tour>`. */
export function useTourContext(): TourContextValue | null {
	return use(TourContext);
}

/**
 * Reads and drives the enclosing tour.
 *
 * For a "Show me around" button that starts it, or — in an interactive tour — the spotlit
 * control's own handler calling `next()`. Throws outside one.
 */
export function useTour(): TourContextValue {
	const context = useTourContext();
	if (!context) {
		throw new Error("useTour must be called inside a <Tour>.");
	}
	return context;
}

/** The registry, for a part that cannot work without one. Internal. */
export function useTourRegistryPart(component: string): TourRegistryValue {
	const context = use(TourRegistryContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Tour>.`);
	}
	return context;
}
