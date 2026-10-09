import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable/pressable";
import type { FabLabelSide, FabSize, FabVariant } from "./fab.variants";

export type FabContextValue = {
	size: FabSize;
	variant: FabVariant;
	/** A stadium with a label, rather than a circle. */
	isExtended: boolean;
	isDisabled: boolean;
};

const FabContext = createContext<FabContextValue | null>(null);

/**
 * Supplies the enclosing fab's axes to its subtree, so `Fab.Label` and a custom
 * child can match it without the root passing props down.
 *
 * A leaf of its own, importing nothing but types, so a part reads it without
 * importing `./fab` and closing a cycle.
 */
export function FabProvider({ value, children }: { value: FabContextValue; children: ReactNode }): ReactElement {
	return <FabContext value={value}>{children}</FabContext>;
}
FabProvider.displayName = "DelacourUI.Fab.Provider";

/** The enclosing fab's axes, or null outside a `<Fab>`. */
export function useFabContext(): FabContextValue | null {
	return use(FabContext);
}

/** Reads the enclosing fab's axes. Throws outside a `<Fab>`. */
export function useFab(): FabContextValue {
	const context = useFabContext();
	if (!context) throw new Error("useFab must be called inside a <Fab>.");
	return context;
}

/** The enclosing fab's axes, for a part that cannot work without one. Internal. */
export function useFabPart(component: string): FabContextValue {
	const context = useFabContext();
	if (!context) throw new Error(`${component} must be rendered inside a <Fab>.`);
	return context;
}

export type FabGroupContextValue = {
	/** The dial's one spring, 0 closed → 1 open. It overshoots; readers clamp. */
	progress: SharedValue<number>;
	isOpen: boolean;
	/** How many actions the dial holds — each action's stagger window depends on it. */
	count: number;
	labelSide: FabLabelSide;
	/** The trigger's size. Actions are always `sm`, centred on the trigger's centre line. */
	size: FabSize;
	haptic: false | HapticFeedback;
	/** Fade in place instead of rising with a stagger. */
	isReducedMotion: boolean;
	close: () => void;
};

const FabGroupContext = createContext<FabGroupContextValue | null>(null);

/** Supplies the dial's spring and state to every action in it. */
export function FabGroupProvider({
	value,
	children,
}: {
	value: FabGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <FabGroupContext value={value}>{children}</FabGroupContext>;
}
FabGroupProvider.displayName = "DelacourUI.Fab.Group.Provider";

/** The enclosing dial, or null outside a `<Fab.Group>`. */
export function useFabGroupContext(): FabGroupContextValue | null {
	return use(FabGroupContext);
}

/** Reads the enclosing dial. Throws outside a `<Fab.Group>`. */
export function useFabGroup(): FabGroupContextValue {
	const context = useFabGroupContext();
	if (!context) throw new Error("useFabGroup must be called inside a <Fab.Group>.");
	return context;
}

/** The enclosing dial, for a part that cannot work without one. Internal. */
export function useFabGroupPart(component: string): FabGroupContextValue {
	const context = useFabGroupContext();
	if (!context) throw new Error(`${component} must be rendered inside a <Fab.Group>.`);
	return context;
}

export type FabActionItemContextValue = {
	/** 0 is the action nearest the trigger; the dial unfolds outward from it. */
	index: number;
};

const FabActionItemContext = createContext<FabActionItemContextValue | null>(null);

/**
 * Supplies one action its place in the dial.
 *
 * The group wraps each child in one of these rather than cloning an `index`
 * prop onto it: a provider reaches an action a caller wrapped in a fragment or
 * produced from a helper, and adds no view to the layout.
 */
export function FabActionItemProvider({
	value,
	children,
}: {
	value: FabActionItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <FabActionItemContext value={value}>{children}</FabActionItemContext>;
}
FabActionItemProvider.displayName = "DelacourUI.Fab.Group.ItemProvider";

/** This action's place in the dial. Throws outside a `<Fab.Group>`. Internal. */
export function useFabActionItem(component: string): FabActionItemContextValue {
	const context = use(FabActionItemContext);
	if (!context) throw new Error(`${component} must be rendered inside a <Fab.Group>.`);
	return context;
}
