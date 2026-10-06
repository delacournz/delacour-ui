import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import type { AccessibilityActionEvent, LayoutChangeEvent, ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { cancelAnimation, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { cn } from "../../lib/cn";
import { resolvePanOrigin, resolvePanPosition, resolveSettleTarget, resolveVisibleRange } from "../../lib/paging";
import {
	CarouselSlideProvider,
	useCarouselMotionPart,
	useCarouselOptionsPart,
	useCarouselPart,
} from "./carousel.context";
import {
	CAROUSEL_CALM_DURATION_MS,
	CAROUSEL_PAN,
	CAROUSEL_SPRING,
	carouselVariants,
	resolveCarouselA11yValue,
	resolveItemInset,
	resolveItemPitch,
	resolveItemSize,
} from "./carousel.variants";
import { CarouselItem } from "./carousel-item";

export type CarouselContentProps = ViewProps & {
	/** `Carousel.Item` elements, as direct children. Their source order is the order of record. */
	children: ReactNode;
	/** Horizontal only. Sets the viewport's height from its width; a vertical carousel needs a height class. */
	aspectRatio?: number;
	className?: string;
};

/**
 * The clipped viewport the slides are placed in, the surface the pan is claimed
 * on, and the element assistive tech adjusts.
 *
 * **It walks its direct children for `Carousel.Item`s**, as `ListGroup` finds its
 * rows and `Tabs` its panels: the walk is the count, the order and the window. An
 * Item behind a wrapper is not found, so a wrapper is warned about in development
 * rather than silently dropping slides.
 *
 * **Only the window is mounted** — `windowSize` slides either side of the
 * committed index, wrapped when looping — so a run of thirty photos decodes five.
 *
 * **The pan claims its axis and yields the other**: `activeOffset` on the travel
 * axis under `failOffset` across it, so a horizontal carousel scrolls inside
 * `Screen.ScrollArea` and a `Pressable` in a slide still taps. Not
 * `blocksExternalGesture` — React Native's `ScrollView` has no handler tag.
 *
 * **It is the adjustable element**, not the root, so `Carousel.Previous` and
 * `Carousel.Next` stay reachable in their own right. A VoiceOver or TalkBack
 * swipe up or down moves a slide and the OS reads the new "2 of 5".
 */
export function CarouselContent({
	children,
	aspectRatio,
	className,
	style,
	onLayout,
	...props
}: CarouselContentProps): ReactElement {
	const { index, count, next, previous } = useCarouselPart("Carousel.Content");
	const {
		accessibilityLabel,
		gap,
		isDisabled,
		isScrollEnabled,
		itemSize,
		isCalm,
		loop,
		orientation,
		setCount,
		variant,
		windowSize,
	} = useCarouselOptionsPart("Carousel.Content");
	const { commitFromPan, geometry, position, stopAutoplay } = useCarouselMotionPart("Carousel.Content");

	const items = useMemo(() => collectItems(children), [children]);

	useLayoutEffect(() => {
		setCount(items.length);
	}, [items.length, setCount]);

	const isHorizontal = orientation === "horizontal";
	const [viewport, setViewport] = useState(0);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			onLayout?.(event);
			const { height, width } = event.nativeEvent.layout;
			const length = isHorizontal ? width : height;
			setViewport(length);
		},
		[isHorizontal, onLayout]
	);

	// The geometry is computed here, on the JS thread, and published as one shared
	// value — one write, so the UI thread never reads a pitch from one layout and a
	// size from another.
	useLayoutEffect(() => {
		geometry.value = {
			inset: resolveItemInset(viewport, itemSize),
			pitch: resolveItemPitch(viewport, itemSize, gap),
			size: resolveItemSize(viewport, itemSize),
			viewport,
		};
	}, [gap, geometry, itemSize, viewport]);

	const isPeek = itemSize !== undefined && viewport > 0 && itemSize < viewport;

	const panStart = useSharedValue(0);
	// Whether the pan actually activated. `onFinalize` fires for every touch,
	// including the taps and cross-axis scrolls that never did, and must not
	// retarget a spring it never disturbed.
	const isDragging = useSharedValue(false);

	const panGesture = useMemo(() => {
		const activate = [-CAROUSEL_PAN.activate, CAROUSEL_PAN.activate] as [number, number];
		const fail = [-CAROUSEL_PAN.fail, CAROUSEL_PAN.fail] as [number, number];
		const translationKey = isHorizontal ? "translationX" : "translationY";
		const velocityKey = isHorizontal ? "velocityX" : "velocityY";
		const pan = Gesture.Pan().enabled(!isDisabled && isScrollEnabled && count > 1);
		const axis = isHorizontal
			? pan.activeOffsetX(activate).failOffsetY(fail)
			: pan.activeOffsetY(activate).failOffsetX(fail);

		return (
			axis
				// Autoplay stops for good on the first touch, activated or not.
				.onBegin(() => {
					"worklet";
					scheduleOnRN(stopAutoplay);
				})
				// The spring is cancelled on ACTIVATION, never on touch-down: most
				// touches go on to fail against the cross axis, and cancelling for one
				// of those would freeze the run between two slides with nothing to
				// restart it. `Tabs` found that by dragging, then scrolling the page.
				.onStart((event) => {
					"worklet";
					cancelAnimation(position);
					isDragging.value = true;
					panStart.value = resolvePanOrigin(position.value, event[translationKey], geometry.value.pitch);
				})
				.onUpdate((event) => {
					"worklet";
					position.value = resolvePanPosition({
						count,
						loop,
						pitch: geometry.value.pitch,
						start: panStart.value,
						translation: event[translationKey],
					});
				})
				// `onFinalize`, the one callback on every path out — END, FAILED and
				// CANCELLED — so a drag the OS cancels still settles.
				.onFinalize((event, success) => {
					"worklet";
					if (!isDragging.value) return;
					isDragging.value = false;

					const pitch = geometry.value.pitch;
					const velocity = success ? event[velocityKey] : 0;
					const destination = resolveSettleTarget({
						count,
						loop,
						pitch,
						position: position.value,
						startIndex: Math.round(panStart.value),
						velocity,
					});

					if (isCalm) {
						position.value = withTiming(destination, { duration: CAROUSEL_CALM_DURATION_MS });
					} else {
						const slidesPerSecond = pitch > 0 ? -velocity / pitch : 0;
						position.value = withSpring(destination, { ...CAROUSEL_SPRING, velocity: slidesPerSecond });
					}

					scheduleOnRN(commitFromPan, destination);
				})
		);
	}, [
		commitFromPan,
		count,
		geometry,
		isCalm,
		isDisabled,
		isDragging,
		isHorizontal,
		isScrollEnabled,
		loop,
		panStart,
		position,
		stopAutoplay,
	]);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (isDisabled) return;
			if (event.nativeEvent.actionName === "increment") next();
			else if (event.nativeEvent.actionName === "decrement") previous();
		},
		[isDisabled, next, previous]
	);

	const visible = resolveVisibleRange(index, items.length, loop, windowSize);
	const slots = carouselVariants({ orientation, variant });

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View
				accessibilityActions={count > 1 ? ACCESSIBILITY_ACTIONS : undefined}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="adjustable"
				accessibilityState={{ disabled: isDisabled }}
				accessibilityValue={{ text: resolveCarouselA11yValue(index, count) }}
				accessible
				className={cn(slots.viewport(), className)}
				onAccessibilityAction={handleAccessibilityAction}
				onLayout={handleLayout}
				style={[isHorizontal && aspectRatio !== undefined ? { aspectRatio } : null, style]}
				{...props}
			>
				{visible.map((slide) => (
					<CarouselSlideProvider
						key={slideKey(items[slide], slide)}
						value={{ index: slide, isActive: slide === index, isPeek }}
					>
						{items[slide]}
					</CarouselSlideProvider>
				))}
			</Animated.View>
		</GestureDetector>
	);
}
CarouselContent.displayName = "DelacourUI.Carousel.Content";

/** The two actions an assistive swipe on an `adjustable` maps to. */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }];

/**
 * The `Carousel.Item`s among `children`, in source order.
 *
 * `Children.toArray` drops the nulls a conditional slide leaves and keys what it
 * keeps. Anything else is warned about in development: a wrapper around an Item
 * hides it from the walk, and a slide that silently vanishes is worse than a
 * warning.
 */
function collectItems(children: ReactNode): ReactElement[] {
	const items: ReactElement[] = [];
	for (const child of Children.toArray(children)) {
		if (isValidElement(child) && child.type === CarouselItem) {
			items.push(child);
		} else if (process.env.NODE_ENV !== "production") {
			console.warn(
				"Carousel.Content: only Carousel.Item elements are slides, and they must be direct children. A wrapper hides the slide inside it."
			);
		}
	}
	return items;
}

/** A slide's key: the caller's, which `Children.toArray` has already made unique, or its index. */
function slideKey(item: ReactElement | undefined, slide: number): string {
	return item?.key ?? `slide-${slide}`;
}
