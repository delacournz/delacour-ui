import type { ReactElement, ReactNode } from "react";
import { I18nManager } from "react-native";
import { LayoutDirection } from "uniwind";
import { DirectionProvider, directionContextValue, useDirectionContext } from "./direction.context";
import { type DirectionValue, resolveDirection } from "./direction.variants";

export type DirectionProps = {
	/**
	 * Forces a direction for this subtree. Omitted, the subtree inherits the
	 * enclosing `Direction`, else the app's `I18nManager.isRTL`.
	 */
	dir?: DirectionValue;
	children?: ReactNode;
};

/**
 * Sets the reading direction for a subtree.
 *
 * Three things move together: Yoga mirrors the subtree's rows, `start`/`end`
 * insets and text alignment on the next frame; Uniwind's `rtl:` and `ltr:`
 * variants resolve against this subtree rather than the app; and
 * `useDirection()` / `useDirectionSign()` report it, so gesture and `translateX`
 * maths can follow. No remount — changing `dir` relayouts in place.
 *
 * The wrapper is `display: contents`: it adds no box, so a `flex-1` child keeps
 * flexing against the real parent. That is why there is no `className` or
 * `style`; nest a `View` for a box. With `dir` omitted it writes no direction at
 * all, so an unconditional wrapper costs nothing.
 *
 * It does not translate, format numbers or dates, or reach content portalled
 * out of the tree — a sheet, popover or toast re-wraps itself with the value
 * `useDirection()` read before the jump.
 *
 * @example
 * ```tsx
 * <DelacourProvider>
 *   <Direction dir={locale.isRTL ? "rtl" : "ltr"}>
 *     <App />
 *   </Direction>
 * </DelacourProvider>
 * ```
 *
 * @example
 * ```tsx
 * <Direction dir="rtl">
 *   <Text>مرحبا</Text>
 *   <Direction dir="ltr">
 *     <Text.Code>+1 555 010 4477</Text.Code>
 *   </Direction>
 * </Direction>
 * ```
 */
export function Direction({ dir, children }: DirectionProps): ReactElement {
	const parent = useDirectionContext();
	const resolved = resolveDirection(dir, parent?.dir ?? null, I18nManager.isRTL);

	return (
		<LayoutDirection rtl={dir === undefined ? undefined : dir === "rtl"}>
			<DirectionProvider value={directionContextValue(resolved)}>{children}</DirectionProvider>
		</LayoutDirection>
	);
}
Direction.displayName = "DelacourUI.Direction";
