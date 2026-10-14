import { createContext, type ReactElement, type ReactNode, use } from "react";
import { I18nManager } from "react-native";
import { type DirectionValue, directionSign } from "./direction.variants";

export type DirectionContextValue = {
	/** The subtree's reading direction. */
	dir: DirectionValue;
	/** `dir === "rtl"`, for a call site that wants a boolean. */
	isRTL: boolean;
	/** `1` in LTR, `-1` in RTL. Multiply a physical x delta or a `translateX` by it. */
	sign: 1 | -1;
};

const DirectionContext = createContext<DirectionContextValue | null>(null);

const VALUES: Record<DirectionValue, DirectionContextValue> = {
	ltr: { dir: "ltr", isRTL: false, sign: directionSign("ltr") },
	rtl: { dir: "rtl", isRTL: true, sign: directionSign("rtl") },
};

/**
 * The context value for one direction. One shared object per direction, so a
 * value is referentially stable across renders and a consumer's effect or memo
 * keyed on it re-runs only when the direction actually changes.
 */
export function directionContextValue(dir: DirectionValue): DirectionContextValue {
	return VALUES[dir];
}

/**
 * Publishes a direction to its subtree without touching layout.
 *
 * `Direction` mounts this for you. Reach for it directly only to re-publish a
 * direction across a portal — content teleported out of the tree loses the
 * Yoga direction and the context both, and has to be wrapped again with the
 * value read before the jump.
 */
export function DirectionProvider({
	value,
	children,
}: {
	value: DirectionContextValue;
	children: ReactNode;
}): ReactElement {
	return <DirectionContext value={value}>{children}</DirectionContext>;
}
DirectionProvider.displayName = "DelacourUI.Direction.Provider";

/** The enclosing `Direction`'s context, or null outside one. */
export function useDirectionContext(): DirectionContextValue | null {
	return use(DirectionContext);
}

/**
 * The direction the calling component reads in.
 *
 * Never throws: outside any `Direction` it falls back to `I18nManager.isRTL`,
 * the app's process-wide setting, so a library component works with no setup.
 * That flag only changes on an app restart, so reading it per call is enough.
 */
export function useDirection(): DirectionContextValue {
	const context = useDirectionContext();
	return context ?? directionContextValue(I18nManager.isRTL ? "rtl" : "ltr");
}

/**
 * `1` in LTR, `-1` in RTL — sugar for `useDirection().sign`.
 *
 * A plain number, so a worklet can close over it and pick up a change when the
 * component re-renders.
 */
export function useDirectionSign(): 1 | -1 {
	return useDirection().sign;
}
