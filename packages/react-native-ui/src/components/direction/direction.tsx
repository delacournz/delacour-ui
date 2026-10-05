import type { ReactElement, ReactNode } from "react";
import { I18nManager, View, type ViewStyle } from "react-native";
import { LayoutDirection } from "uniwind";
import { DirectionProvider, directionContextValue, useDirectionContext } from "./direction.context";
import { type DirectionValue, resolveDirection } from "./direction.variants";

export type DirectionProps = {
	/**
	 * Forces a direction for this subtree. Omitted, the subtree inherits the
	 * enclosing `Direction`, else the app's `I18nManager.isRTL`.
	 */
	dir?: DirectionValue;
	/**
	 * Classes for the box that carries the direction. It is an ordinary `View`,
	 * so a wrapper around a whole screen needs `flex-1`.
	 */
	className?: string;
	children?: ReactNode;
};

/**
 * One style per state, so the wrapper never allocates. With no `dir` the box
 * is `display: contents` — it adds nothing to layout and writes no direction.
 */
const STYLES: Record<DirectionValue | "inherit", ViewStyle> = {
	inherit: { display: "contents" },
	ltr: { direction: "ltr" },
	rtl: { direction: "rtl" },
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
 * With `dir` set the wrapper is a real `View`, not a `display: contents` node:
 * on React Native 0.86 Yoga does not pass `direction` from a contents node to
 * its children, so a box is the only thing that flips them. Lay it out like any
 * `View` — `className="flex-1"` around a screen. With `dir` omitted it is
 * `display: contents` and writes no direction, so an unconditional wrapper
 * costs nothing.
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
export function Direction({ dir, className, children }: DirectionProps): ReactElement {
	const parent = useDirectionContext();
	const resolved = resolveDirection(dir, parent?.dir ?? null, I18nManager.isRTL);

	// The outer View flips the layout; `LayoutDirection` inside it only scopes
	// Uniwind's `rtl:` / `ltr:` variants, since its own contents node cannot.
	return (
		<View className={className} style={STYLES[dir ?? "inherit"]}>
			<LayoutDirection rtl={dir === undefined ? undefined : dir === "rtl"}>
				<DirectionProvider value={directionContextValue(resolved)}>{children}</DirectionProvider>
			</LayoutDirection>
		</View>
	);
}
Direction.displayName = "DelacourUI.Direction";
