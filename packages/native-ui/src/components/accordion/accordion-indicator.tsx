import { type ReactElement, type ReactNode, useMemo } from "react";
import type { ViewProps } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { IconChevronBottom } from "../../icons/central";
import { Icon, type IconDefaults, IconDefaultsProvider } from "../icon";
import { useAccordionItemPart, useAccordionPart } from "./accordion.context";
import { ACCORDION_INDICATOR_ROTATION, ACCORDION_INDICATOR_TOKEN, accordionVariants } from "./accordion.variants";

/** What a render-function indicator is handed. */
export type AccordionIndicatorState = { isExpanded: boolean };

export type AccordionIndicatorProps = Omit<ViewProps, "children" | "style"> & {
	/**
	 * Turn with the panel. Set `false` for a glyph that *swaps* rather than
	 * rotates — a plus becoming a minus reads as broken when it also spins.
	 */
	isAnimated?: boolean;
	className?: string;
	/**
	 * A glyph, or a function handed the item's settled state.
	 *
	 * The function form exists so a swapping glyph needs no component of its own:
	 * reading `isExpanded` means calling a hook, and a hook cannot be called in the
	 * parent's JSX. `Slider.Track` takes a function for the same reason.
	 *
	 * It matters more than convenience here. A trigger finds its indicator by
	 * element type, so an indicator wrapped in a component of the caller's own is
	 * invisible to it and a second, default one is composed in beside it. Handing
	 * the state over removes the reason to write that wrapper at all.
	 */
	children?: ReactNode | ((state: AccordionIndicatorState) => ReactNode);
};

/**
 * The glyph saying an item opens, turning as it does.
 *
 * Composed into a trigger that holds none, so a bare `<Accordion.Trigger>` is
 * already complete — `Radio`'s rule for its indicator, and the same reasoning: an
 * item has exactly one, so a caller who wrote none wants the default.
 *
 * **The rotation interpolates off the item's own `progress`**, the very value the
 * panel's height reads, so the glyph and the panel are in phase by construction
 * rather than by two springs tuned to match. It also means a custom glyph turns
 * exactly like the default one — pass anything as children and it rotates, unless
 * `isAnimated={false}` says otherwise.
 *
 * The rotation lives on this node rather than on the trigger's because
 * `Pressable`'s own root `Animated.View` already owns `transform` through a
 * `useAnimatedStyle` of its own, and two animated styles on one node fight for
 * the same prop.
 *
 * Its subtree inherits the accordion's glyph step and the muted token, so a
 * composed `<Icon>` needs nothing said at the call site.
 *
 * @example
 * <Accordion.Indicator isAnimated={false}>
 *   {({ isExpanded }) => <Icon icon={isExpanded ? IconMinusSmall : IconPlusSmall} />}
 * </Accordion.Indicator>
 */
export function AccordionIndicator({
	isAnimated = true,
	className,
	children,
	...props
}: AccordionIndicatorProps): ReactElement {
	const { size } = useAccordionPart("Accordion.Indicator");
	const { isExpanded, progress } = useAccordionItemPart("Accordion.Indicator");

	const slots = accordionVariants({ size });
	const glyphClassName = slots.glyph();

	const rotationStyle = useAnimatedStyle(() => ({
		transform: [
			{
				rotate: `${interpolate(
					progress.value,
					[0, 1],
					[ACCORDION_INDICATOR_ROTATION.collapsed, ACCORDION_INDICATOR_ROTATION.expanded]
				)}deg`,
			},
		],
	}));

	const iconDefaults = useMemo<IconDefaults>(
		() => ({ className: glyphClassName, color: ACCORDION_INDICATOR_TOKEN }),
		[glyphClassName]
	);

	return (
		<Animated.View className={slots.indicator({ className })} style={isAnimated ? rotationStyle : undefined} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{renderGlyph(children, isExpanded)}</IconDefaultsProvider>
		</Animated.View>
	);
}
AccordionIndicator.displayName = "DelacourUI.Accordion.Indicator";

/** The caller's glyph, the state they asked for, or the default chevron. */
function renderGlyph(
	children: ReactNode | ((state: AccordionIndicatorState) => ReactNode),
	isExpanded: boolean
): ReactNode {
	if (typeof children === "function") return children({ isExpanded });
	return children ?? <Icon icon={IconChevronBottom} />;
}
