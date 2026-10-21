import { type ReactElement, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, useWindowDimensions, type ViewInstance } from "react-native";
import Animated, { Easing, ReduceMotion, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { HapticFeedback } from "../pressable";
import type { TourStepEntry } from "./tour.types";
import {
	isSameHoleRect,
	resolveCardPlacement,
	resolveHoleRect,
	resolveOverlayInsets,
	resolveRelativeRect,
	resolveTourFooter,
	resolveTourHoleFadeDuration,
	TOUR_CARD_GAP,
	TOUR_CARD_MAX_WIDTH,
	TOUR_ENTER_MS,
	TOUR_GUTTER,
	type TourHoleRect,
	type TourLabels,
	type TourPoint,
	type TourRect,
	type TourSize,
	type TourStepOptions,
} from "./tour.variants";
import { TourCard } from "./tour-card";
import { type TourHoleValues, TourMask } from "./tour-mask";
import { TourScrim } from "./tour-scrim";

export type TourOverlayProps = {
	entry: TourStepEntry;
	options: TourStepOptions;
	index: number;
	total: number;
	labels: TourLabels;
	hasProgress: boolean;
	hasSkip: boolean;
	isDismissible: boolean;
	isInteractive: boolean;
	haptic: false | HapticFeedback;
	cardClassName?: string;
	/** The tour's root, measured for the overlay's own origin when it draws inside it. */
	rootRef: RefObject<ViewInstance | null>;
	onNext: () => void;
	onBack: () => void;
	onSkip: () => void;
	/** The tour's, for the card's parts to derive theirs from. */
	testID?: string;
};

/** A measured target, tagged with the step it belongs to so a stale measurement is never placed. */
type Measured = { order: number; target: TourRect; origin: TourPoint };

/** `measureInWindow` as a promise. A view that has not laid out reports zeros, which still resolves. */
function measureInWindow(view: ViewInstance): Promise<TourRect> {
	return new Promise((resolve) => {
		view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
	});
}

/**
 * Everything drawn while a tour is open: the mask, the scrim and the card.
 *
 * **Measuring.** On each step — and on every window change, which is rotation — it waits one frame
 * for the caller's `onStepChange` scroll to land, then measures the step's wrapper in window
 * coordinates. An interactive tour draws inside the tour's root rather than over the window, so
 * it measures that root too and subtracts its origin.
 *
 * **The hole** is five shared values set straight to each new target, so an interactive scrim
 * passes touches to the new control at once. The mask keeps the hole it replaced in a second set
 * and crossfades the two: the dim fills in over the old target while it lifts over the new one.
 * The first hole of an opening is open from the start, and the dim fades up around it
 * (`TOUR_ENTER_MS`) — the tour's entrance (`resolveTourHoleFadeDuration`).
 *
 * **The card** is mounted once for the whole tour and glides to each step's place, its content
 * swapping as it goes. It keeps the last height it measured, so the next step is placed with it
 * at once and retargeted if the new content lays out taller or shorter. It is first shown once
 * both its height and its target are known, so the opening never shows it unplaced.
 */
export function TourOverlay({
	entry,
	options,
	index,
	total,
	labels,
	hasProgress,
	hasSkip,
	isDismissible,
	isInteractive,
	haptic,
	cardClassName,
	rootRef,
	onNext,
	onBack,
	onSkip,
	testID,
}: TourOverlayProps): ReactElement {
	const window = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const isReducedMotion = useReducedMotion();

	const [size, setSize] = useState<TourSize | null>(null);
	const [measured, setMeasured] = useState<Measured | null>(null);
	const [cardHeight, setCardHeight] = useState<number | null>(null);

	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const width = useSharedValue(0);
	const height = useSharedValue(0);
	const radius = useSharedValue(0);
	const hole = useMemo<TourHoleValues>(() => ({ x, y, width, height, radius }), [x, y, width, height, radius]);
	const previousX = useSharedValue(0);
	const previousY = useSharedValue(0);
	const previousWidth = useSharedValue(0);
	const previousHeight = useSharedValue(0);
	const previousRadius = useSharedValue(0);
	const previous = useMemo<TourHoleValues>(
		() => ({ x: previousX, y: previousY, width: previousWidth, height: previousHeight, radius: previousRadius }),
		[previousX, previousY, previousWidth, previousHeight, previousRadius]
	);
	const reveal = useSharedValue(0);
	const previousReveal = useSharedValue(0);
	const dim = useSharedValue(0);
	const lastHole = useRef<TourHoleRect | null>(null);

	const { order, ref } = entry;

	// Re-runs on a new step and on a window change. The previous measurement stays in state until
	// the new one lands, so the hole travels from where it was rather than from nowhere.
	useEffect(() => {
		if (window.width <= 0 || window.height <= 0) return;
		let isCancelled = false;

		const frame = requestAnimationFrame(() => {
			const target = ref.current;
			if (!target) return;
			const root = isInteractive ? rootRef.current : null;

			Promise.all([measureInWindow(target), root ? measureInWindow(root) : Promise.resolve(null)]).then(
				([rect, rootRect]) => {
					if (isCancelled) return;
					setMeasured({ order, target: rect, origin: rootRect ? { x: rootRect.x, y: rootRect.y } : { x: 0, y: 0 } });
				}
			);
		});

		return () => {
			isCancelled = true;
			cancelAnimationFrame(frame);
		};
	}, [order, ref, isInteractive, rootRef, window.width, window.height]);

	const isCurrent = measured?.order === order;
	const { padding, shape, radius: corner } = options;
	const holeRect = useMemo(
		() =>
			measured
				? resolveHoleRect({
						target: resolveRelativeRect(measured.target, measured.origin),
						padding,
						shape,
						radius: corner,
					})
				: null,
		[measured, padding, shape, corner]
	);

	// The hole being left becomes the previous one, at whatever opacity it had reached, so a step
	// changed mid-fade hands over without a pop.
	useEffect(() => {
		if (!holeRect) return;
		const last = lastHole.current;
		lastHole.current = holeRect;
		const duration = resolveTourHoleFadeDuration({
			isFirst: last === null,
			isSameHole: last !== null && isSameHoleRect(last, holeRect),
		});

		if (last) {
			previousX.value = last.x;
			previousY.value = last.y;
			previousWidth.value = last.width;
			previousHeight.value = last.height;
			previousRadius.value = last.radius;
		}
		x.value = holeRect.x;
		y.value = holeRect.y;
		width.value = holeRect.width;
		height.value = holeRect.height;
		radius.value = holeRect.radius;

		if (last === null) {
			dim.value = withTiming(1, {
				duration: TOUR_ENTER_MS,
				easing: Easing.out(Easing.cubic),
				reduceMotion: ReduceMotion.Never,
			});
		}
		if (duration === 0) {
			previousReveal.value = 0;
			reveal.value = 1;
			return;
		}
		const config = { duration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never };
		previousReveal.value = reveal.value;
		previousReveal.value = withTiming(0, config);
		reveal.value = 0;
		reveal.value = withTiming(1, config);
	}, [
		holeRect,
		x,
		y,
		width,
		height,
		radius,
		previousX,
		previousY,
		previousWidth,
		previousHeight,
		previousRadius,
		reveal,
		previousReveal,
		dim,
	]);

	const handleLayout = (event: LayoutChangeEvent): void => {
		const { width: w, height: h } = event.nativeEvent.layout;
		setSize((previous) => (previous?.width === w && previous.height === h ? previous : { width: w, height: h }));
	};

	const handleCardHeight = useCallback((next: number) => {
		setCardHeight((current) => (current === next ? current : next));
	}, []);

	const overlayInsets =
		size && measured
			? resolveOverlayInsets({ insets, origin: measured.origin, size, window })
			: { top: insets.top, bottom: insets.bottom, left: insets.left, right: insets.right };
	const placement = resolveCardPlacement({
		hole: holeRect ?? { x: 0, y: 0, width: 0, height: 0 },
		cardHeight: cardHeight ?? 0,
		window: size ?? window,
		insets: overlayInsets,
		gap: TOUR_CARD_GAP,
		gutter: TOUR_GUTTER,
		maxWidth: TOUR_CARD_MAX_WIDTH,
		preference: options.placement,
	});
	const isPlaced = isCurrent && cardHeight !== null && size !== null;
	const footer = resolveTourFooter({ index, total, hasSkip });

	// `direction: "ltr"` because every coordinate here is a physical window position; the card
	// restores the app's own direction for its content.
	return (
		<Animated.View
			onLayout={handleLayout}
			pointerEvents={isInteractive ? "box-none" : "auto"}
			style={[StyleSheet.absoluteFill, { direction: "ltr" }]}
		>
			{size ? (
				<>
					<TourScrim
						hole={hole}
						isInteractive={isInteractive}
						onPress={isDismissible ? onSkip : undefined}
						size={size}
					/>
					{holeRect ? (
						<TourMask
							dim={dim}
							hole={hole}
							previous={previous}
							previousReveal={previousReveal}
							reveal={reveal}
							size={size}
						/>
					) : null}
				</>
			) : null}
			<TourCard
				className={cardClassName}
				description={entry.description}
				footer={footer}
				haptic={haptic}
				hasProgress={hasProgress}
				index={index}
				isPlaced={isPlaced}
				isReducedMotion={isReducedMotion}
				labels={labels}
				onBack={onBack}
				onEscape={isDismissible ? onSkip : undefined}
				onHeight={handleCardHeight}
				onNext={onNext}
				onSkip={onSkip}
				placement={placement}
				testID={testID}
				title={entry.title}
				total={total}
			/>
		</Animated.View>
	);
}
TourOverlay.displayName = "DelacourUI.Tour.Overlay";
