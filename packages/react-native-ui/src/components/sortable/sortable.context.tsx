import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { AccessibilityActionEvent, AccessibilityActionInfo } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { SortableDrag } from "./sortable.types";
import type { SortableActivation, SortableMoveDirection } from "./sortable.variants";

export type SortableContextValue = {
	/** The row ids in render order — the caller's `value`. */
	order: readonly string[];
	/** Whether each row in `order` is pinned, index for index. Read from the rows' own props. */
	pinned: readonly boolean[];
	activation: SortableActivation;
	longPressDelay: number;
	isDisabled: boolean;
	/** The row being dragged or landing, or null. Written on the UI thread. */
	activeId: SharedValue<string | null>;
	/** The lifted row's translation from its resting top, scroll included. */
	dragY: SharedValue<number>;
	/** 0 at rest, 1 fully lifted. Drives the lifted row's scale. */
	lift: SharedValue<number>;
	/** Where every resting row should sit, relative to its own layout, for the current target slot. */
	shifts: SharedValue<Record<string, number>>;
	/** 0 idle, 1 dragging, 2 landing. A row snaps rather than springs when this reads 0. */
	phase: SharedValue<number>;
	isReducedMotion: boolean;
	drag: SortableDrag;
	/** A row reports its measured height here. */
	setHeight: (id: string, height: number) => void;
	/** The screen-reader path: move a row one slot, call `onReorder` and announce where it landed. */
	move: (id: string, direction: SortableMoveDirection) => void;
};

export type SortableItemContextValue = {
	id: string;
	/** The row's index in the caller's order. */
	index: number;
	/** How many rows the list holds. */
	count: number;
	/** True while this row is lifted or landing. Read it in a worklet — it never causes a render. */
	isActive: SharedValue<boolean>;
	isPinned: boolean;
	/** This row's own state, or the list's. */
	isDisabled: boolean;
	/** Whether a finger can lift this row: neither disabled nor pinned. */
	canDrag: boolean;
	/** Moves the row up one slot, past pinned rows. A no-op when it cannot. */
	moveUp: () => void;
	/** Moves the row down one slot, past pinned rows. A no-op when it cannot. */
	moveDown: () => void;
	/** "Position 2 of 5". */
	positionText: string;
	/** The Move up / Move down actions this row can perform right now — none when disabled or pinned. */
	accessibilityActions: AccessibilityActionInfo[];
	onAccessibilityAction: (event: AccessibilityActionEvent) => void;
};

const SortableContext = createContext<SortableContextValue | null>(null);
const SortableItemContext = createContext<SortableItemContextValue | null>(null);

/**
 * Supplies the list's order, its shared drag state and its dispatchers to its rows.
 *
 * Lives in its own module, importing nothing but React and types, so a part can read it without
 * importing `./sortable` — which would close a cycle and leave the context `undefined` on a cold
 * start. See AGENTS.md rule 3.
 */
export function SortableProvider({
	value,
	children,
}: {
	value: SortableContextValue;
	children: ReactNode;
}): ReactElement {
	return <SortableContext value={value}>{children}</SortableContext>;
}
SortableProvider.displayName = "DelacourUI.Sortable.Provider";

/** Supplies one row's id, position and actions to its handle and its content. */
export function SortableItemProvider({
	value,
	children,
}: {
	value: SortableItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <SortableItemContext value={value}>{children}</SortableItemContext>;
}
SortableItemProvider.displayName = "DelacourUI.Sortable.Item.Provider";

/** The enclosing list's context, or null outside a `<Sortable>`. */
export function useSortableContext(): SortableContextValue | null {
	return use(SortableContext);
}

/** The enclosing row's context, or null outside a `<Sortable.Item>`. */
export function useSortableItemContext(): SortableItemContextValue | null {
	return use(SortableItemContext);
}

/**
 * Reads the enclosing row: its id and index, whether it is lifted, and the two moves a screen
 * reader performs.
 *
 * For a custom handle or a row that has to answer to its own drag — `isActive` is a shared value,
 * so an animated style can follow the lift without a render. Throws outside a `<Sortable.Item>`.
 */
export function useSortableItem(): SortableItemContextValue {
	const context = useSortableItemContext();
	if (!context) {
		throw new Error("useSortableItem must be called inside a <Sortable.Item>.");
	}
	return context;
}

/**
 * The enclosing list, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`.
 */
export function useSortablePart(component: string): SortableContextValue {
	const context = useSortableContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Sortable>.`);
	}
	return context;
}

/** The enclosing row, for a part that cannot work without one. Internal. */
export function useSortableItemPart(component: string): SortableItemContextValue {
	const context = useSortableItemContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Sortable.Item>.`);
	}
	return context;
}
