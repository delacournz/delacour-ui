import { type ReactElement, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, useWindowDimensions, type View } from "react-native";
import Animated, { Easing, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { HapticFeedback } from "../pressable";
import type { TourStepEntry } from "./tour.types";
import {
	resolveCardPlacement,
	resolveHoleRect,
	resolveOverlayInsets,
	resolveRelativeRect,
	resolveTourFooter,
	resolveTourTransitionDuration,
	TOUR_CARD_GAP,
	TOUR_CARD_MAX_WIDTH,
	TOUR_GUTTER,
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
	rootRef: RefObject<View | null>;
	onNext: () => void;
	onBack: () => void;
	onSkip: () => void;
};

/** A measured target, tagged with the step it belongs to so a stale measurement is never placed. */
type Measured = { order: number; target: TourRect; origin: TourPoint };

/** `measureInWindow` as a promise. A view that has not laid out reports zeros, which still resolves. */
function measureInWindow(view: View): Promise<TourRect> {
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
 * **The hole** is five shared values eased to each new target, so the mask and an interactive
 * scrim follow it on the UI thread. The first target of an opening and every target under reduce
 * motion jump.
 *
 * **The card** is keyed by step; each caches the height it measured, and the card is only
 * shown once both its height and its target are known — so it is placed once, on the right
 * side, and never seen flipping.
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
}: TourOverlayProps): ReactElement {
	const window = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const isReducedMotion = useReducedMotion();

	const [size, setSize] = useState<TourSize | null>(null);
	const [measured, setMeasured] = useState<Measured | null>(null);
	const [cardHeights, setCardHeights] = useState<Readonly<Record<number, number>>>({});

	const x = useSharedValue(0);
	const y = useSharedValue(0);
	const width = useSharedValue(0);
	const height = useSharedValue(0);
	const radius = useSharedValue(0);
	const hole = useMemo<TourHoleValues>(() => ({ x, y, width, height, radius }), [x, y, width, height, radius]);
	const hasHole = useRef(false);

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

	useEffect(() => {
		if (!holeRect) return;
		const duration = resolveTourTransitionDuration({ isReducedMotion, isFirst: !hasHole.current });
		hasHole.current = true;
		const config = { duration, easing: Easing.inOut(Easing.cubic) };
		x.value = duration === 0 ? holeRect.x : withTiming(holeRect.x, config);
		y.value = duration === 0 ? holeRect.y : withTiming(holeRect.y, config);
		width.value = duration === 0 ? holeRect.width : withTiming(holeRect.width, config);
		height.value = duration === 0 ? holeRect.height : withTiming(holeRect.height, config);
		radius.value = duration === 0 ? holeRect.radius : withTiming(holeRect.radius, config);
	}, [holeRect, isReducedMotion, x, y, width, height, radius]);

	const handleLayout = (event: LayoutChangeEvent): void => {
		const { width: w, height: h } = event.nativeEvent.layout;
		setSize((previous) => (previous?.width === w && previous.height === h ? previous : { width: w, height: h }));
	};

	const handleCardHeight = useCallback(
		(cardHeight: number) => {
			setCardHeights((previous) => (previous[order] === cardHeight ? previous : { ...previous, [order]: cardHeight }));
		},
		[order]
	);

	const cardHeight = cardHeights[order];
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
	const isPlaced = isCurrent && cardHeight !== undefined && size !== null;
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
					{holeRect ? <TourMask hole={hole} size={size} /> : null}
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
				key={order}
				labels={labels}
				onBack={onBack}
				onEscape={isDismissible ? onSkip : undefined}
				onHeight={handleCardHeight}
				onNext={onNext}
				onSkip={onSkip}
				placement={placement}
				title={entry.title}
				total={total}
			/>
		</Animated.View>
	);
}
TourOverlay.displayName = "DelacourUI.Tour.Overlay";
