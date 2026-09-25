import { type ReactElement, type ReactNode, useMemo } from "react";
import type { ViewProps } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { IconChevronBottom } from "../../icons/central";
import { Icon, type IconDefaults, IconDefaultsProvider } from "../icon";
import { useCollapsiblePart } from "./collapsible.context";
import {
	COLLAPSIBLE_INDICATOR_ROTATION,
	COLLAPSIBLE_INDICATOR_TOKEN,
	collapsibleVariants,
} from "./collapsible.variants";

/** What a render-function indicator is handed. */
export type CollapsibleIndicatorState = { isOpen: boolean };

export type CollapsibleIndicatorProps = Omit<ViewProps, "children" | "style"> & {
	/**
	 * Turn with the panel. Set `false` for a glyph that *swaps* rather than
	 * rotates — a plus becoming a minus reads as broken when it also spins.
	 */
	isAnimated?: boolean;
	className?: string;
	/**
	 * A glyph, or a function handed the settled state.
	 *
	 * The function form exists so a swapping glyph needs no component of its own.
	 * The trigger finds its indicator by element type, so one wrapped in a
	 * component of the caller's own is invisible to it and a second, default one is
	 * composed in beside it — handing the state over removes the reason to write
	 * that wrapper.
	 */
	children?: ReactNode | ((state: CollapsibleIndicatorState) => ReactNode);
};

/**
 * The glyph saying the section opens, turning as it does.
 *
 * Composed into a trigger that holds none, so a bare `<Collapsible.Trigger>` is
 * already complete.
 *
 * **The rotation interpolates off the collapsible's own `progress`**, the value
 * the panel's height reads, so the glyph and the panel are in phase by
 * construction — and a custom glyph turns exactly like the default one. The
 * rotation lives on this node rather than the trigger's because `Pressable`
 * already owns `transform` there.
 *
 * @example
 * <Collapsible.Indicator isAnimated={false}>
 *   {({ isOpen }) => <Icon icon={isOpen ? IconMinusSmall : IconPlusSmall} />}
 * </Collapsible.Indicator>
 */
export function CollapsibleIndicator({
	isAnimated = true,
	className,
	children,
	...props
}: CollapsibleIndicatorProps): ReactElement {
	const { isOpen, progress, size } = useCollapsiblePart("Collapsible.Indicator");

	const slots = collapsibleVariants({ size });
	const glyphClassName = slots.glyph();

	const rotationStyle = useAnimatedStyle(() => ({
		transform: [
			{
				rotate: `${interpolate(
					progress.value,
					[0, 1],
					[COLLAPSIBLE_INDICATOR_ROTATION.collapsed, COLLAPSIBLE_INDICATOR_ROTATION.expanded]
				)}deg`,
			},
		],
	}));

	const iconDefaults = useMemo<IconDefaults>(
		() => ({ className: glyphClassName, color: COLLAPSIBLE_INDICATOR_TOKEN }),
		[glyphClassName]
	);

	return (
		<Animated.View className={slots.indicator({ className })} style={isAnimated ? rotationStyle : undefined} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{renderGlyph(children, isOpen)}</IconDefaultsProvider>
		</Animated.View>
	);
}
CollapsibleIndicator.displayName = "DelacourUI.Collapsible.Indicator";

/** The caller's glyph, the state they asked for, or the default chevron. */
function renderGlyph(children: CollapsibleIndicatorProps["children"], isOpen: boolean): ReactNode {
	if (typeof children === "function") return children({ isOpen });
	return children ?? <Icon icon={IconChevronBottom} />;
}
