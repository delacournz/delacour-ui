import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import { I18nManager } from "react-native";
import { type DrawerEdge, type DrawerSide, resolveDrawerEdge } from "./drawer.variants";

/** Anything `AccessibilityInfo.setAccessibilityFocus` can be pointed at through `findNodeHandle`. */
export type DrawerFocusTarget = object;

export type DrawerContextValue = {
	/** Whether the drawer is open — the owner's state, not the exit animation's. */
	isOpen: boolean;
	/** Opens or closes it. Reports through `onOpenChange` only when the value changes. */
	setOpen: (isOpen: boolean) => void;
	/** `setOpen(false)`, for an action inside the panel. */
	close: () => void;
	/** Whether the scrim, Android back and the iOS escape gesture close it. */
	isDismissible: boolean;
	/** The logical side `Drawer.Content` opens from. `"start"` outside the content. */
	side: DrawerSide;
	/** The physical edge that side resolves to under the layout direction. */
	edge: DrawerEdge;
};

/** The root's state, before `Drawer.Content` adds its side. */
export type DrawerRootValue = Omit<DrawerContextValue, "side" | "edge"> & {
	/** The `nativeID` `Drawer.Title` carries and the panel is labelled by. */
	titleId: string;
	/** The `nativeID` `Drawer.Description` carries. */
	descriptionId: string;
	/** The trigger, so focus can return to it on close. */
	triggerRef: RefObject<DrawerFocusTarget | null>;
	/** The title, so focus can land on it on open. */
	titleRef: RefObject<DrawerFocusTarget | null>;
};

/** The side and edge `Drawer.Content` resolved, for the parts inside it. */
export type DrawerPanelValue = { side: DrawerSide; edge: DrawerEdge };

const DrawerContext = createContext<DrawerRootValue | null>(null);

const DrawerPanelContext = createContext<DrawerPanelValue>({
	edge: resolveDrawerEdge("start", I18nManager.isRTL),
	side: "start",
});

/**
 * Supplies the drawer's state to its parts.
 *
 * Lives in its own module, importing nothing but `drawer.variants`, so a part
 * can read it without importing `./drawer` — that import would close a cycle,
 * and Metro serves a partially initialised module for one.
 */
export function DrawerProvider({ value, children }: { value: DrawerRootValue; children: ReactNode }): ReactElement {
	return <DrawerContext value={value}>{children}</DrawerContext>;
}
DrawerProvider.displayName = "DelacourUI.Drawer.Provider";

/** Supplies the resolved side and edge to the parts inside `Drawer.Content`. */
export function DrawerPanelProvider({
	value,
	children,
}: {
	value: DrawerPanelValue;
	children: ReactNode;
}): ReactElement {
	return <DrawerPanelContext value={value}>{children}</DrawerPanelContext>;
}
DrawerPanelProvider.displayName = "DelacourUI.Drawer.PanelProvider";

/** The enclosing drawer's context, or null outside a `<Drawer>`. */
export function useDrawerContext(): DrawerContextValue | null {
	const root = use(DrawerContext);
	const panel = use(DrawerPanelContext);
	if (!root) return null;
	return {
		close: root.close,
		edge: panel.edge,
		isDismissible: root.isDismissible,
		isOpen: root.isOpen,
		setOpen: root.setOpen,
		side: panel.side,
	};
}

/**
 * Reads the enclosing drawer's open state, its setter and — inside
 * `Drawer.Content` — the side it opened from and the edge that resolved to.
 *
 * Lets a custom row close the drawer after it navigates, without the caller
 * threading a setter down. Throws outside a `<Drawer>`.
 */
export function useDrawer(): DrawerContextValue {
	const context = useDrawerContext();
	if (!context) {
		throw new Error("useDrawer must be called inside a <Drawer>.");
	}
	return context;
}

/**
 * The root's full context, for a part that cannot work without one. Internal:
 * not re-exported from `index.ts`.
 */
export function useDrawerPart(component: string): DrawerRootValue {
	const context = use(DrawerContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Drawer>.`);
	}
	return context;
}

/** The side and edge `Drawer.Content` resolved. */
export function useDrawerPanel(): DrawerPanelValue {
	return use(DrawerPanelContext);
}
