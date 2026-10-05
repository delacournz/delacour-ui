import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { ProgressButtonSize, ProgressButtonVariant } from "./progress-button.variants";

export type ProgressButtonContextValue = {
	variant: ProgressButtonVariant;
	size: ProgressButtonSize;
	/** Whether the hold has completed and not yet been reset. */
	isCompleted: boolean;
	isDisabled: boolean;
	/** How far the fill has got, 0 to 1, on the UI thread. */
	progress: SharedValue<number>;
};

/**
 * Which copy of the children a part is rendering in.
 *
 * The children are drawn twice — once on the resting surface and once inside
 * the fill — and a `ProgressButton.Label` picks its colour from this rather
 * than from a prop the caller would have to repeat.
 */
export type ProgressButtonLayer = "surface" | "fill";

const ProgressButtonContext = createContext<ProgressButtonContextValue | null>(null);
const ProgressButtonLayerContext = createContext<ProgressButtonLayer>("surface");

/**
 * Supplies the enclosing button's state to its subtree.
 *
 * In a leaf of its own, importing nothing but types, so a part can read it
 * without importing `./progress-button` and closing a cycle (package AGENTS.md
 * rule 3).
 */
export function ProgressButtonProvider({
	value,
	children,
}: {
	value: ProgressButtonContextValue;
	children: ReactNode;
}): ReactElement {
	return <ProgressButtonContext value={value}>{children}</ProgressButtonContext>;
}
ProgressButtonProvider.displayName = "DelacourUI.ProgressButton.Provider";

/** Marks which copy of the children — surface or fill — its subtree is. */
export function ProgressButtonLayerProvider({
	value,
	children,
}: {
	value: ProgressButtonLayer;
	children: ReactNode;
}): ReactElement {
	return <ProgressButtonLayerContext value={value}>{children}</ProgressButtonLayerContext>;
}
ProgressButtonLayerProvider.displayName = "DelacourUI.ProgressButton.LayerProvider";

/** The enclosing button's state, or null outside a `<ProgressButton>`. */
export function useProgressButtonContext(): ProgressButtonContextValue | null {
	return use(ProgressButtonContext);
}

/**
 * Reads the enclosing button's state.
 *
 * For a custom child that changes with the hold — `progress` is a shared value,
 * so a child can drive an animated style off it without a render per frame.
 * Throws outside a `<ProgressButton>`.
 */
export function useProgressButton(): ProgressButtonContextValue {
	const context = useProgressButtonContext();
	if (!context) {
		throw new Error("useProgressButton must be called inside a <ProgressButton>.");
	}
	return context;
}

/**
 * The enclosing button's state, for a compound part that cannot work without it.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useProgressButtonPart(component: string): ProgressButtonContextValue {
	const context = useProgressButtonContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <ProgressButton>.`);
	}
	return context;
}

/** Which copy of the children this part is in. `surface` outside a button. */
export function useProgressButtonLayer(): ProgressButtonLayer {
	return use(ProgressButtonLayerContext);
}
