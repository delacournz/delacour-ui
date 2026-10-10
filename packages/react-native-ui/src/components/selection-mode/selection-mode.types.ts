import type { HapticFeedback } from "../pressable/pressable";

/**
 * Everything a selection exposes — what the root publishes and what
 * `useSelectionMode()` returns.
 *
 * Shared by the root, which builds it, and the context leaf, which carries it.
 */
export type SelectionModeState = {
	/** Whether the mode is on: a press toggles, the header and bar show. */
	isActive: boolean;
	/** The picked ids, in the order they were picked. */
	selected: string[];
	/** Whether `value` is picked. */
	isSelected: (value: string) => boolean;
	/** Picks or unpicks `value`, respecting `max`. */
	toggle: (value: string) => void;
	/** Picks every value up to `max`, keeping existing picks first. */
	selectAll: () => void;
	/** Unpicks everything, and stays in the mode. */
	clear: () => void;
	/** Turns the mode on, picking `value` when one is given. */
	enter: (value?: string) => void;
	/** Turns the mode off. Clears an uncontrolled selection; a controlled one is left to the caller. */
	exit: () => void;
	/** How many ids are picked. */
	count: number;
	/** How many ids are pickable, or `undefined` when the root was given no `values`. */
	total: number | undefined;
	/** The cap on picks, if any. */
	max: number | undefined;
	/** Whether select-all has nothing left to add — the control reads "Deselect all". */
	isAllSelected: boolean;
	/** Played on enter and on every toggle. */
	haptic: false | HapticFeedback;
};
