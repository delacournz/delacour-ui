import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { Platform } from "react-native";
import {
	type HitSlopInsets,
	type HitTargetSize,
	resolveMinimumHitSlop,
	resolveMinimumHitTarget,
} from "../components/pressable/pressable.variants";

const MaterialHitTargetContext = createContext(false);

export type MinimumHitTargetProviderProps = {
	/** Grow Android's minimum touch target from 44 to Material's 48dp. iOS stays at 44. */
	isMaterialHitTarget: boolean;
	children: ReactNode;
};

/**
 * Sets the minimum touch target every small control beneath it reaches with `hitSlop`.
 * `DelacourProvider` mounts it from its own `isMaterialHitTarget`; mount it by hand only in an
 * app that composes its providers itself.
 *
 * Optional: without one, the minimum is 44 on every platform.
 */
export function MinimumHitTargetProvider({
	isMaterialHitTarget,
	children,
}: MinimumHitTargetProviderProps): ReactElement {
	return <MaterialHitTargetContext.Provider value={isMaterialHitTarget}>{children}</MaterialHitTargetContext.Provider>;
}
MinimumHitTargetProvider.displayName = "DelacourUI.MinimumHitTargetProvider";

/** The minimum touch target, in points, for this platform and this app. See `resolveMinimumHitTarget`. */
export function useMinimumHitTarget(): number {
	return resolveMinimumHitTarget({
		isMaterialHitTarget: useContext(MaterialHitTargetContext),
		platform: Platform.OS,
	});
}

/**
 * The `hitSlop` that grows a target drawn at `size` to this app's minimum, or `undefined` when it
 * is already there. `cap` bounds each side for targets packed closer than the slop would need.
 * See `resolveMinimumHitSlop`.
 *
 * @example
 * // A 20pt ✕ inside a badge: 12pt of slop each side, unless the caller passed their own.
 * const slop = useMinimumHitSlop(20);
 * <Pressable hitSlop={hitSlop ?? slop} … />
 */
export function useMinimumHitSlop(size: HitTargetSize, options?: { cap?: number }): number | HitSlopInsets | undefined {
	return resolveMinimumHitSlop(size, useMinimumHitTarget(), options);
}
