import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { Platform } from "react-native";
import { useCSSVariable } from "uniwind";
import {
	type HitSlopInsets,
	type HitTargetSize,
	resolveMinimumHitSlop,
	resolveMinimumHitTarget,
	resolveThemeLength,
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

/** A CSS variable's name, as Uniwind's `useCSSVariable` takes it: `--spacing-button-sm`. */
export type ThemeLengthVariable = `--${string}`;

/**
 * The resolved theme's value of a length variable, in points — what the target
 * actually draws at, under whatever style the app applied — or `fallback` (the
 * default token) when the theme holds no length for it.
 *
 * A hit target sized from a constant shrinks out from under its slop the moment
 * an app retunes its density: the default `--spacing-button-sm` is 36, a denser
 * style sets 32, and a slop of 4 computed for 36 leaves the target at 40. Read
 * the variable instead and hand the number to {@link useMinimumHitSlop}.
 *
 * Follows `Uniwind.updateCSSVariables`, the light/dark switch and a
 * `ScopedVariables` boundary, and is right on the first frame, which a measured
 * `onLayout` is not. It reads the token, not the layout: a caller's `className`
 * that overrides the height is not seen, and that caller passes its own `hitSlop`.
 *
 * @example
 * const height = useThemeLength("--spacing-button-sm", 36);
 * const slop = useMinimumHitSlop(height);
 */
export function useThemeLength(name: ThemeLengthVariable, fallback: number): number {
	return resolveThemeLength(useCSSVariable(name), fallback);
}
