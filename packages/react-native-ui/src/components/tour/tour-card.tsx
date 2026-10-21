import { type ReactElement, useEffect, useRef } from "react";
import { AccessibilityInfo, I18nManager, type LayoutChangeEvent, View, type ViewInstance } from "react-native";
import Animated, {
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { Button } from "../button";
import type { HapticFeedback } from "../pressable";
import { Text } from "../text";
import {
	resolveTourAnnouncement,
	resolveTourCardEntrance,
	resolveTourProgressLabel,
	resolveTourTestIDs,
	resolveTourTransitionDuration,
	type TourCardPlacement,
	type TourFooter,
	type TourLabels,
	tourVariants,
} from "./tour.variants";

type TourCardProps = {
	title: string;
	description?: string;
	/** Zero-based. */
	index: number;
	total: number;
	labels: TourLabels;
	footer: TourFooter;
	hasProgress: boolean;
	/** Where the card sits. Its height may still be a guess until `isPlaced`. */
	placement: TourCardPlacement;
	/** The card has been measured and its target too — show it and move focus to it. */
	isPlaced: boolean;
	/** Jump between steps rather than glide. */
	isReducedMotion: boolean;
	onHeight: (height: number) => void;
	onNext: () => void;
	onBack: () => void;
	onSkip: () => void;
	/** Skip on VoiceOver's escape gesture. Undefined when the tour is not dismissible. */
	onEscape?: () => void;
	haptic: false | HapticFeedback;
	className?: string;
	/** The tour's; the card and each action carry one derived from it (`resolveTourTestIDs`). */
	testID?: string;
};

/**
 * The card beside the hole: position, title, description and the footer's actions.
 *
 * **Mounted once for the whole tour.** On opening it is laid out invisible, measured, placed, and
 * only then brought in a beat after the dim, fading while it rises a few points into place
 * (`resolveTourCardEntrance`) — reduce motion keeps the fade and drops the rise. From then on it stays visible and glides
 * to each step's place while its content swaps, so the card reads as one thing following the
 * hole rather than one card vanishing and another appearing. Reduce motion jumps it instead
 * (`resolveTourTransitionDuration`). A placement that changes mid-glide — the new content laid out
 * taller — retargets the glide from where the card is.
 *
 * **The text is one accessibility element** whose label is the announcement — "Step 2 of 5.
 * Search. Find anything." — and focus moves to it once the card is placed. The card is
 * `accessibilityViewIsModal`, so VoiceOver stays inside it.
 *
 * The overlay lays out left-to-right, because window coordinates are physical; the card restores
 * the app's direction so its own content mirrors in a right-to-left locale.
 */
export function TourCard({
	title,
	description,
	index,
	total,
	labels,
	footer,
	hasProgress,
	placement,
	isPlaced,
	isReducedMotion,
	onHeight,
	onNext,
	onBack,
	onSkip,
	onEscape,
	haptic,
	className,
	testID,
}: TourCardProps): ReactElement {
	const slots = tourVariants();
	const header = useRef<ViewInstance>(null);
	const opacity = useSharedValue(0);
	const left = useSharedValue(placement.left);
	const top = useSharedValue(placement.top);
	const width = useSharedValue(placement.width);
	const rise = useSharedValue(0);
	const isShown = useRef(false);

	// Until it is first shown, the card follows its placement exactly, so it is measured at the
	// width it will be drawn at.
	useEffect(() => {
		if (!isPlaced && isShown.current) return;
		const duration = resolveTourTransitionDuration({ isReducedMotion, isFirst: !isShown.current });
		if (duration === 0) {
			left.value = placement.left;
			top.value = placement.top;
			width.value = placement.width;
			return;
		}
		const config = { duration, easing: Easing.out(Easing.cubic) };
		left.value = withTiming(placement.left, config);
		top.value = withTiming(placement.top, config);
		width.value = withTiming(placement.width, config);
	}, [isPlaced, isReducedMotion, placement.left, placement.top, placement.width, left, top, width]);

	useEffect(() => {
		if (!isPlaced || isShown.current) return;
		isShown.current = true;
		const entrance = resolveTourCardEntrance({ isReducedMotion });
		const config = { duration: entrance.duration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never };
		rise.value = entrance.rise;
		rise.value = withDelay(entrance.delay, withTiming(0, config));
		opacity.value = withDelay(entrance.delay, withTiming(1, config));
	}, [isPlaced, isReducedMotion, opacity, rise]);

	// Each step, once placed — `isPlaced` falls while a new step is measured and rises again once it
	// is. A frame later, so the modal has presented and the element exists for the screen reader.
	useEffect(() => {
		if (!isPlaced) return;
		const frame = requestAnimationFrame(() => {
			if (header.current) AccessibilityInfo.sendAccessibilityEvent(header.current, "focus");
		});
		return () => cancelAnimationFrame(frame);
	}, [isPlaced]);

	const position = useAnimatedStyle(() => ({
		opacity: opacity.value,
		left: left.value,
		top: top.value,
		width: width.value,
		transform: [{ translateY: rise.value }],
	}));

	const handleLayout = (event: LayoutChangeEvent): void => {
		onHeight(event.nativeEvent.layout.height);
	};

	const current = index + 1;
	const testIDs = resolveTourTestIDs(testID);
	const announcement = resolveTourAnnouncement({ current, total, title, description, labels });

	return (
		<Animated.View
			accessibilityViewIsModal
			className={slots.card({ className })}
			onAccessibilityEscape={onEscape}
			onLayout={handleLayout}
			testID={testIDs.card}
			style={[{ direction: I18nManager.isRTL ? "rtl" : "ltr" }, position]}
		>
			<View
				accessibilityLabel={announcement}
				accessibilityRole="header"
				accessible
				className={slots.header()}
				ref={header}
			>
				{hasProgress ? (
					<Text.Caption className={slots.progress()}>{resolveTourProgressLabel(current, total, labels)}</Text.Caption>
				) : null}
				<Text.Header className={slots.title()}>{title}</Text.Header>
				{description ? <Text.Paragraph className={slots.description()}>{description}</Text.Paragraph> : null}
			</View>
			<View className={slots.footer()}>
				{footer.hasSkip ? (
					<Button className="me-auto" haptic={haptic} onPress={onSkip} testID={testIDs.skip} variant="ghost">
						{labels.skip}
					</Button>
				) : null}
				{footer.hasBack ? (
					<Button haptic={haptic} onPress={onBack} testID={testIDs.back} variant="outline">
						{labels.back}
					</Button>
				) : null}
				<Button haptic={haptic} onPress={onNext} testID={testIDs.next} variant="primary">
					{footer.isLast ? labels.finish : labels.next}
				</Button>
			</View>
		</Animated.View>
	);
}
TourCard.displayName = "DelacourUI.Tour.Card";
