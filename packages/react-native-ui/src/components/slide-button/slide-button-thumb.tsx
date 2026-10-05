import { type ReactElement, type ReactNode, useMemo } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { IconCheckmark1Small, IconChevronLeft, IconChevronRight } from "../../icons/central";
import { Icon, IconDefaultsProvider } from "../icon";
import { useSlideButtonPart } from "./slide-button.context";
import { SLIDE_BUTTON_GLYPH_TOKEN, slideButtonVariants } from "./slide-button.variants";

export type SlideButtonThumbProps = Omit<ViewProps, "children" | "style"> & {
	/** Replaces the chevron. An `Icon` inherits the handle's glyph size and colour. */
	children?: ReactNode;
	className?: string;
};

/**
 * The handle the finger drags.
 *
 * Composed in automatically when the children hold none, and drawn last however
 * the children were ordered, so it always passes *over* the label.
 *
 * **It holds no gesture of its own.** One `Gesture.Pan()` on the rail drives it,
 * so a drag that lands on the rail beside the handle still moves it — the same
 * trade `Switch.Thumb` and `Slider.Thumb` make.
 *
 * **One animated style, one node**: width, visibility and position together,
 * because two `useAnimatedStyle`s on one view fight for the same props.
 *
 * Invisible until the rail has been measured — a handle drawn before then has no
 * width and sits at a garbage offset for a frame.
 *
 * With no children it draws a chevron pointing the way it travels (mirrored
 * under RTL), which crosses into a tick when the slide confirms. Children replace
 * both: a custom glyph is the caller's to change.
 */
export function SlideButtonThumb({ className, children, ...props }: SlideButtonThumbProps): ReactElement {
	const { size, variant, isRTL, offset, handleWidth } = useSlideButtonPart("SlideButton.Thumb");
	const direction = isRTL ? -1 : 1;

	const thumbStyle = useAnimatedStyle(() => ({
		opacity: handleWidth.value > 0 ? 1 : 0,
		transform: [{ translateX: offset.value * direction }],
		width: handleWidth.value,
	}));

	const slots = slideButtonVariants({ size, variant });
	const glyphColor = useThemeColor(SLIDE_BUTTON_GLYPH_TOKEN);
	const glyphClassName = slots.thumbGlyph();
	const iconDefaults = useMemo(
		() => ({ className: glyphClassName, color: glyphColor ?? "" }),
		[glyphClassName, glyphColor]
	);

	return (
		<Animated.View className={slots.thumb({ className })} style={thumbStyle} {...props}>
			<IconDefaultsProvider value={iconDefaults}>{children ?? <SlideButtonGlyph />}</IconDefaultsProvider>
		</Animated.View>
	);
}
SlideButtonThumb.displayName = "DelacourUI.SlideButton.Thumb";

/**
 * The default glyph: a chevron toward the travel that crosses into a tick.
 *
 * Both marks are always mounted, stacked, and swap by opacity and a quarter turn
 * off one shared value — so the crossing runs on the UI thread and never waits on
 * a re-render to start.
 */
function SlideButtonGlyph(): ReactElement {
	const { isRTL, glyph } = useSlideButtonPart("SlideButton.Thumb");
	const direction = isRTL ? -1 : 1;

	const chevronStyle = useAnimatedStyle(() => ({
		opacity: 1 - glyph.value,
		transform: [{ rotate: `${glyph.value * 90 * direction}deg` }],
	}));
	const tickStyle = useAnimatedStyle(() => ({
		opacity: glyph.value,
		transform: [{ rotate: `${(glyph.value - 1) * 90 * direction}deg` }],
	}));

	return (
		<>
			<Animated.View className="absolute" style={chevronStyle}>
				<Icon icon={isRTL ? IconChevronLeft : IconChevronRight} />
			</Animated.View>
			<Animated.View className="absolute" style={tickStyle}>
				<Icon icon={IconCheckmark1Small} />
			</Animated.View>
		</>
	);
}
SlideButtonGlyph.displayName = "DelacourUI.SlideButton.Thumb.Glyph";
