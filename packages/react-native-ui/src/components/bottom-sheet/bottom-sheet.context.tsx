import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { type ComponentRef, createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { SharedValue } from "react-native-reanimated";

/**
 * The imperative handle a `BottomSheetModal` exposes.
 *
 * Derived from the component rather than imported by name: gorhom re-exports the
 * modal's *value* from its package root but not the `BottomSheetModalMethods`
 * type behind its ref, and reaching into `lib/typescript/` for one would pin this
 * package to a path that is not part of that package's public surface.
 */
export type BottomSheetHandle = ComponentRef<typeof BottomSheetModal>;

export type BottomSheetContextValue = {
	isOpen: boolean;
	/** The controllable-state setter. Reports upward whether controlled or not. */
	setOpen: (isOpen: boolean) => void;
	open: () => void;
	close: () => void;
	/**
	 * The modal's handle, for the imperative calls that have no declarative form —
	 * `snapToIndex`, `expand`, `collapse`. Presenting and dismissing are driven by
	 * `isOpen` instead, so a caller never has to keep two sources in step.
	 */
	sheetRef: RefObject<BottomSheetHandle | null>;
};

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function BottomSheetProvider({
	value,
	children,
}: {
	value: BottomSheetContextValue;
	children: ReactNode;
}): ReactElement {
	return <BottomSheetContext value={value}>{children}</BottomSheetContext>;
}
BottomSheetProvider.displayName = "DelacourUI.BottomSheet.Provider";

/** The sheet's state, or `null` outside one. For a component that works either way. */
export function useBottomSheetContext(): BottomSheetContextValue | null {
	return use(BottomSheetContext);
}

/**
 * The enclosing sheet's open state and controls.
 *
 * Reach for this to drive a sheet from a control of your own — a row that closes
 * it, a button that snaps it somewhere — without threading props down.
 */
export function useBottomSheet(): BottomSheetContextValue {
	const context = use(BottomSheetContext);
	if (context === null) throw new Error("useBottomSheet must be called inside a <BottomSheet>.");
	return context;
}

/** The same read, with a message naming the part that is misplaced. Internal. */
export function useBottomSheetPart(component: string): BottomSheetContextValue {
	const context = use(BottomSheetContext);
	if (context === null) throw new Error(`${component} must be rendered inside a <BottomSheet>.`);
	return context;
}

export type BottomSheetPortalContextValue = {
	/**
	 * The `BottomSheet.Overlay` element the portal lifted out of its own children,
	 * or `null` when none was written.
	 *
	 * gorhom takes the scrim as a `backdropComponent` render prop rather than as a
	 * child, so the element cannot be rendered where it was declared. The portal
	 * publishes it here and `BottomSheet.Container` clones it into that slot.
	 */
	overlay: ReactElement | null;
};

const BottomSheetPortalContext = createContext<BottomSheetPortalContextValue | null>(null);

export function BottomSheetPortalProvider({
	value,
	children,
}: {
	value: BottomSheetPortalContextValue;
	children: ReactNode;
}): ReactElement {
	return <BottomSheetPortalContext value={value}>{children}</BottomSheetPortalContext>;
}
BottomSheetPortalProvider.displayName = "DelacourUI.BottomSheet.Portal.Provider";

/** What the enclosing portal lifted out, or `null` for a container written without one. */
export function useBottomSheetPortalContext(): BottomSheetPortalContextValue | null {
	return use(BottomSheetPortalContext);
}

export type BottomSheetContainerContextValue = {
	/**
	 * Whether a pinned footer is drawing at the bottom of this sheet.
	 *
	 * `BottomSheet.Content` reads it to decide whether the safe-area band is its
	 * to apply. Exactly one part takes it: both applying leaves a gap the height
	 * of the home indicator between the content and the footer.
	 */
	hasStickyFooter: boolean;
	/**
	 * What a pinned footer covers, measured, in points.
	 *
	 * A shared value rather than state: it changes on every frame of the keyboard
	 * animation as the footer gives up its safe-area band, and the body reserves it
	 * with an animated spacer. Routing that through React would commit a dozen
	 * renders per keystroke's worth of keyboard travel. `Screen` publishes its own
	 * chrome the same way.
	 *
	 * Zero when there is no pinned footer.
	 */
	footerHeight: SharedValue<number>;
};

const BottomSheetContainerContext = createContext<BottomSheetContainerContextValue | null>(null);

export function BottomSheetContainerProvider({
	value,
	children,
}: {
	value: BottomSheetContainerContextValue;
	children: ReactNode;
}): ReactElement {
	return <BottomSheetContainerContext value={value}>{children}</BottomSheetContainerContext>;
}
BottomSheetContainerProvider.displayName = "DelacourUI.BottomSheet.Container.Provider";

/** The enclosing container's layout facts, or `null` outside one. */
export function useBottomSheetContainerContext(): BottomSheetContainerContextValue | null {
	return use(BottomSheetContainerContext);
}
