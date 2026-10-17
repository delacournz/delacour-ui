import { type ReactElement, useEffect, useRef } from "react";
import { AccessibilityInfo, I18nManager, type LayoutChangeEvent, View, type ViewInstance } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Button } from "../button";
import type { HapticFeedback } from "../pressable";
import { Text } from "../text";
import {
	resolveTourAnnouncement,
	resolveTourProgressLabel,
	resolveTourTestIDs,
	TOUR_CARD_FADE_MS,
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
 * **Mounted once per step** — the overlay keys it by `order` — so each step measures its own
 * height on mount, which is what lets placement never flip mid-transition: a step that happens to
 * be as tall as the last would otherwise report no layout change and keep the old step's height.
 * It is laid out invisible, measured, placed, and only then faded in. A fade rather than a
 * slide, which is why it ignores reduce motion: nothing travels.
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

	useEffect(() => {
		if (!isPlaced) return;
		opacity.value = withTiming(1, {
			duration: TOUR_CARD_FADE_MS,
			easing: Easing.out(Easing.cubic),
			reduceMotion: ReduceMotion.Never,
		});

		// A frame later, so the modal has presented and the element exists for the screen reader.
		const frame = requestAnimationFrame(() => {
			if (header.current) AccessibilityInfo.sendAccessibilityEvent(header.current, "focus");
		});
		return () => cancelAnimationFrame(frame);
	}, [isPlaced, opacity]);

	const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
			style={[
				{
					direction: I18nManager.isRTL ? "rtl" : "ltr",
					left: placement.left,
					top: placement.top,
					width: placement.width,
				},
				fade,
			]}
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
