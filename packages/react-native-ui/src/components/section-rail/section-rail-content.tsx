import { type ReactElement, useEffect } from "react";
import { I18nManager, ScrollView, View, type ViewProps } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSectionRailPart } from "./section-rail.context";
import {
	resolvePanelAnchor,
	resolvePanelTransformOrigin,
	SECTION_RAIL_DEFAULT_MAX_WIDTH,
	sectionRailVariants,
} from "./section-rail.variants";

export type SectionRailContentProps = ViewProps & {
	/** How wide the panel may grow, in points or as a share of the screen inside its insets. */
	maxWidth?: number | `${number}%`;
	className?: string;
};

/** How long the panel takes to open or close, in ms. */
const PANEL_MS = 160;
/** The scale a closed panel shrinks to, toward its anchor corner. */
const PANEL_CLOSED_SCALE = 0.92;

/**
 * The panel of rows that opens from the rail's edge.
 *
 * **It stays mounted while closed**, transparent and untouchable, because each
 * row registers its title with the rail — the value the trigger speaks — and
 * because a panel that mounted on open would have nothing to fade from. Closed,
 * it is hidden from assistive technology; open, it is modal to VoiceOver and
 * the escape gesture closes it.
 *
 * It fades and scales from its anchor corner — the rail's edge, at its middle
 * or, aligned to the bottom, its bottom corner — over 160ms. Reduce motion keeps
 * the fade and drops the scale.
 *
 * Not portalled: it is positioned in the rail's own full-screen frame, so it
 * draws over whatever the rail is mounted above. A long outline scrolls inside
 * the panel rather than running off the screen; the scroller is `grow-0`, since
 * React Native's default `flexGrow: 1` stretched a short outline's panel down to
 * the frame's edge.
 */
export function SectionRailContent({
	maxWidth = SECTION_RAIL_DEFAULT_MAX_WIDTH,
	className,
	children,
	style,
	...props
}: SectionRailContentProps): ReactElement {
	const { align, frameStyle, isOpen, placement, setOpen } = useSectionRailPart("SectionRail.Content");
	const isReducedMotion = useReducedMotion();
	const slots = sectionRailVariants({ align, placement });
	const transformOrigin = resolvePanelTransformOrigin(resolvePanelAnchor(placement, align), I18nManager.isRTL);

	const progress = useSharedValue(isOpen ? 1 : 0);
	useEffect(() => {
		progress.value = withTiming(isOpen ? 1 : 0, { duration: PANEL_MS, easing: Easing.out(Easing.cubic) });
	}, [isOpen, progress]);

	const animatedStyle = useAnimatedStyle(() => {
		const scale = isReducedMotion ? 1 : PANEL_CLOSED_SCALE + (1 - PANEL_CLOSED_SCALE) * progress.value;
		return { opacity: progress.value, transform: [{ scale }] };
	});

	return (
		<View
			accessibilityElementsHidden={!isOpen}
			className={slots.frame()}
			importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
			pointerEvents={isOpen ? "box-none" : "none"}
			style={frameStyle}
		>
			<Animated.View
				accessibilityViewIsModal={isOpen}
				className={slots.content({ className })}
				onAccessibilityEscape={() => setOpen(false)}
				style={[{ maxWidth, transformOrigin }, animatedStyle, style]}
				{...props}
			>
				<ScrollView bounces={false} className="grow-0" showsVerticalScrollIndicator={false}>
					{children}
				</ScrollView>
			</Animated.View>
		</View>
	);
}
SectionRailContent.displayName = "DelacourUI.SectionRail.Content";
