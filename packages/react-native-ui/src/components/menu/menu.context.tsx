import {
	createContext,
	type ReactElement,
	type ReactNode,
	type RefObject,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { HapticFeedback } from "../pressable/pressable";
import type { MenuAnchorRect } from "./menu.variants";

/** Anything `measureInWindow` can be called on — a host view, or an animated one. */
export type MenuMeasurable = Pick<View, "measureInWindow">;

export type MenuContextValue = {
	isOpen: boolean;
	/** Where the panel is anchored, set on open. `null` until the first open. */
	anchor: MenuAnchorRect | null;
	/**
	 * Opens the menu. With an `anchor` it opens there — ContextMenu passes a
	 * zero-size point. Without one it measures the trigger first.
	 */
	open: (anchor?: MenuAnchorRect) => void;
	close: () => void;
	/** Closes an open menu, opens a closed one from the trigger. */
	toggle: () => void;
	/** The trigger's node, measured on open. */
	triggerRef: RefObject<MenuMeasurable | null>;
	/** Played when a row is chosen. */
	haptic: false | HapticFeedback;
};

const MenuContext = createContext<MenuContextValue | null>(null);

/**
 * The menu's state provider.
 *
 * Exported so ContextMenu can drive the open state with an anchor of its own:
 * build a value with {@link useMenuRootValue} and wrap `Menu.Content` in this,
 * without importing the `Menu` root at all.
 */
export function MenuRootProvider({ value, children }: { value: MenuContextValue; children: ReactNode }): ReactElement {
	return <MenuContext value={value}>{children}</MenuContext>;
}
MenuRootProvider.displayName = "DelacourUI.Menu.RootProvider";

/** The menu's open state and controls, for a custom part. Throws outside a menu. */
export function useMenu(): Pick<MenuContextValue, "isOpen" | "open" | "close"> {
	const { isOpen, open, close } = useMenuPart("useMenu");
	return { close, isOpen, open };
}

/** The whole context, for the menu's own parts. Throws with the part's name outside a menu. */
export function useMenuPart(part: string): MenuContextValue {
	const context = use(MenuContext);
	if (!context) throw new Error(`${part} must be used inside a <Menu>.`);
	return context;
}

export type UseMenuRootValueOptions = {
	isOpen?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	haptic?: false | HapticFeedback;
};

/**
 * Builds a menu's context value: the controllable open state, the anchor, and
 * the trigger measurement.
 *
 * The root calls it; ContextMenu calls it too, and opens with `open(point)`.
 * Callbacks are ref-backed, so the value keeps its identity across a caller
 * passing a fresh `onOpenChange` every render.
 */
export function useMenuRootValue({
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	haptic = false,
}: UseMenuRootValueOptions): MenuContextValue {
	const changeRef = useRef(onOpenChange);
	changeRef.current = onOpenChange;
	const handleChange = useCallback((next: boolean) => changeRef.current?.(next), []);

	const [isOpen, setOpen] = useControllableState<boolean>({
		defaultValue: defaultOpen,
		onChange: handleChange,
		value: isOpenProp,
	});

	const [anchor, setAnchor] = useState<MenuAnchorRect | null>(null);
	const triggerRef = useRef<MenuMeasurable | null>(null);

	const openRef = useRef(isOpen);
	openRef.current = isOpen;

	// Set by `open()` so the effect below can tell an open it asked for from one a
	// controlling parent made by flipping `isOpen` — which still needs a measurement.
	const isOpeningRef = useRef(false);

	const measureTrigger = useCallback((then?: () => void) => {
		const node = triggerRef.current;
		if (!node || typeof node.measureInWindow !== "function") {
			then?.();
			return;
		}

		node.measureInWindow((x, y, width, height) => {
			setAnchor({ height, width, x, y });
			then?.();
		});
	}, []);

	const open = useCallback(
		(next?: MenuAnchorRect) => {
			const show = () => {
				if (openRef.current) return;
				isOpeningRef.current = true;
				setOpen(true);
			};

			if (next) {
				setAnchor(next);
				show();
				return;
			}

			measureTrigger(show);
		},
		[measureTrigger, setOpen]
	);

	useEffect(() => {
		if (!isOpen) return;
		if (isOpeningRef.current) {
			isOpeningRef.current = false;
			return;
		}
		measureTrigger();
	}, [isOpen, measureTrigger]);

	const close = useCallback(() => {
		if (openRef.current) setOpen(false);
	}, [setOpen]);

	const toggle = useCallback(() => {
		if (openRef.current) close();
		else open();
	}, [close, open]);

	return useMemo<MenuContextValue>(
		() => ({ anchor, close, haptic, isOpen, open, toggle, triggerRef }),
		[anchor, close, haptic, isOpen, open, toggle]
	);
}

export type MenuSubContextValue = {
	isOpen: boolean;
	toggle: () => void;
	/** The submenu's travel, 0 closed to 1 open. The chevron and the clip both read it. */
	progress: SharedValue<number>;
	contentHeight: SharedValue<number>;
	onMeasured: () => void;
};

const MenuSubContext = createContext<MenuSubContextValue | null>(null);

export function MenuSubProvider({
	value,
	children,
}: {
	value: MenuSubContextValue;
	children: ReactNode;
}): ReactElement {
	return <MenuSubContext value={value}>{children}</MenuSubContext>;
}
MenuSubProvider.displayName = "DelacourUI.Menu.SubProvider";

export function useMenuSubPart(part: string): MenuSubContextValue {
	const context = use(MenuSubContext);
	if (!context) throw new Error(`${part} must be used inside a <Menu.Sub>.`);
	return context;
}

export type MenuRadioGroupContextValue = {
	value: string | undefined;
	select: (value: string) => void;
};

const MenuRadioGroupContext = createContext<MenuRadioGroupContextValue | null>(null);

export function MenuRadioGroupProvider({
	value,
	children,
}: {
	value: MenuRadioGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <MenuRadioGroupContext value={value}>{children}</MenuRadioGroupContext>;
}
MenuRadioGroupProvider.displayName = "DelacourUI.Menu.RadioGroupProvider";

export function useMenuRadioGroupPart(part: string): MenuRadioGroupContextValue {
	const context = use(MenuRadioGroupContext);
	if (!context) throw new Error(`${part} must be used inside a <Menu.RadioGroup>.`);
	return context;
}
