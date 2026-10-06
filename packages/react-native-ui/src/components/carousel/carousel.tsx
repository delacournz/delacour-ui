import {
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { View } from "react-native";
import { useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useControllableState } from "../../hooks/use-controllable-state";
import { resolveIndexFromPosition, resolveNearestPosition } from "../../lib/paging";
import {
	type CarouselContextValue,
	type CarouselGeometry,
	CarouselMotionProvider,
	type CarouselMotionValue,
	CarouselOptionsProvider,
	type CarouselOptionsValue,
	CarouselProvider,
} from "./carousel.context";
import {
	CAROUSEL_CALM_DURATION_MS,
	CAROUSEL_DEFAULT_AUTOPLAY_INTERVAL_MS,
	CAROUSEL_DEFAULT_WINDOW_SIZE,
	CAROUSEL_GAP_POINTS,
	CAROUSEL_SPRING,
	type CarouselOrientation,
	type CarouselVariant,
	carouselVariants,
	resolveAutoplayNext,
	resolveClampedIndex,
	resolveNavigationState,
} from "./carousel.variants";
import { CarouselCaption } from "./carousel-caption";
import { CarouselContent } from "./carousel-content";
import { CarouselControls } from "./carousel-controls";
import { CarouselDots } from "./carousel-dots";
import { CarouselItem } from "./carousel-item";
import { CarouselNext } from "./carousel-next";
import { CarouselPrevious } from "./carousel-previous";
import { useCarouselAutoplay } from "./use-carousel-autoplay";

type CarouselCommonProps = {
	children: ReactNode;
	/** How slides are drawn off the position: flat, or turned like album covers. Default `track`. */
	variant?: CarouselVariant;
	/** The axis slides travel along. Default `horizontal`. */
	orientation?: CarouselOrientation;
	/** The last slide leads back to the first, both ways. Default `false`. */
	loop?: boolean;
	/**
	 * Slide length along the travel axis, in points. Omitted = the viewport's, one
	 * slide per screen. Smaller = neighbours peek and the active slide is centred.
	 */
	itemSize?: number;
	/** Gap between slides, in points. Default `CAROUSEL_GAP_POINTS` (12). */
	gap?: number;
	/** Slides mounted either side of the active one. Default 2. */
	windowSize?: number;
	/** No gesture, arrows disabled, and assistive tech told so. */
	isDisabled?: boolean;
	/** `false` turns off the pan alone; arrows and `scrollTo` still move it. Default `true`. */
	isScrollEnabled?: boolean;
	/** Advance on a timer. Stops on the first touch; never runs under reduce motion or a screen reader. */
	autoplay?: boolean;
	/** Milliseconds per slide while autoplaying. Default 4000. */
	autoplayInterval?: number;
	className?: string;
	testID?: string;
	/** The carousel's name, e.g. "Featured". Read with the "2 of 5" value. */
	accessibilityLabel?: string;
};

type CarouselStateProps =
	| {
			/** The committed slide, controlled. */
			index: number;
			defaultIndex?: never;
			onIndexChange: (index: number) => void;
	  }
	| {
			index?: undefined;
			/** The slide to start on, while uncontrolled. Default 0. */
			defaultIndex?: number;
			/** Called once per settled change — from the gesture's release, never per frame. */
			onIndexChange?: (index: number) => void;
	  };

export type CarouselProps = CarouselCommonProps & CarouselStateProps;

const EMPTY_GEOMETRY: CarouselGeometry = { inset: 0, pitch: 0, size: 0, viewport: 0 };

function CarouselRoot({
	children,
	variant = "track",
	orientation = "horizontal",
	loop = false,
	itemSize,
	gap = CAROUSEL_GAP_POINTS,
	windowSize = CAROUSEL_DEFAULT_WINDOW_SIZE,
	isDisabled = false,
	isScrollEnabled = true,
	autoplay = false,
	autoplayInterval = CAROUSEL_DEFAULT_AUTOPLAY_INTERVAL_MS,
	className,
	testID,
	accessibilityLabel,
	index: indexProp,
	defaultIndex,
	onIndexChange,
}: CarouselProps): ReactElement {
	const isCalm = useCalmMotion();
	const [count, setCount] = useState(0);

	const [selected, setSelected] = useControllableState<number>({
		value: indexProp,
		defaultValue: defaultIndex ?? 0,
		onChange: onIndexChange,
	});

	const index = resolveClampedIndex(selected, count);

	const position = useSharedValue(index);
	const geometry = useSharedValue<CarouselGeometry>(EMPTY_GEOMETRY);

	// Where `position` is settled or heading, as a slide and as the (unbounded,
	// when looping) position the spring aims at. A ref, not a shared value: only
	// the JS thread asks.
	const target = useRef({ index, position: index });
	const lastCount = useRef(count);
	// Whether the next reconcile animates. `scrollTo(i, { animated: false })` clears it.
	const isNextAnimated = useRef(true);

	// Bumped alongside every commit and unread in the body, which is the point: a
	// CONTROLLED parent that rejects a change re-renders nothing, so a reconcile
	// waiting on its commit would never run and the run would sit on a slide the
	// caller's state says is not current. `Tabs` and `Switch` carry the same token.
	const [commits, requestReconcile] = useReducer((n: number) => n + 1, 0);

	const indexRef = useRef(index);
	indexRef.current = index;
	const countRef = useRef(count);
	countRef.current = count;

	// A shrinking run never leaves a dead index: the clamp is what is drawn, and it
	// is reported once so a controlled parent can catch up.
	const reportedClamp = useRef<number | null>(null);
	useEffect(() => {
		if (count === 0 || selected === index) {
			reportedClamp.current = null;
			return;
		}
		if (reportedClamp.current === index) return;
		reportedClamp.current = index;
		setSelected(index);
	}, [count, index, selected, setSelected]);

	// Deliberately without a cleanup, and that is a bug `Tabs` shipped once. The
	// commit that re-runs this effect is usually the one the GESTURE just caused,
	// and the gesture has already started the settle spring. A cleanup that
	// cancelled the previous animation would cancel that spring, and this run would
	// take the `none` branch and restart nothing — the run freezes between two
	// slides. An in-flight spring on an unmounted carousel is harmless.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `commits` is the re-run token, see above
	useEffect(() => {
		const countChanged = lastCount.current !== count;
		lastCount.current = count;
		if (count === 0) return;

		const current = target.current;
		if (!countChanged && current.index === index) {
			isNextAnimated.current = true;
			return;
		}

		const animated = !countChanged && isNextAnimated.current;
		isNextAnimated.current = true;

		const destination = loop ? resolveNearestPosition(current.position, index, count) : index;
		target.current = { index, position: destination };

		if (!animated) position.value = destination;
		else if (isCalm) position.value = withTiming(destination, { duration: CAROUSEL_CALM_DURATION_MS });
		else position.value = withSpring(destination, CAROUSEL_SPRING);
	}, [commits, count, index, isCalm, loop, position]);

	const go = useCallback(
		(next: number, animated: boolean) => {
			const total = countRef.current;
			if (total === 0) return;
			const wrapped = loop ? ((Math.round(next) % total) + total) % total : resolveClampedIndex(next, total);
			if (wrapped === indexRef.current) return;
			isNextAnimated.current = animated;
			setSelected(wrapped);
			requestReconcile();
		},
		[loop, setSelected]
	);

	// Called from the pan's settle alone. The gesture has ALREADY started the
	// spring towards `targetPosition`, so recording it here is what makes the
	// reconcile a no-op when the change is accepted — leaving the fling its
	// momentum — and a spring back when a controlled parent rejects it.
	const commitFromPan = useCallback(
		(targetPosition: number) => {
			const next = resolveIndexFromPosition(targetPosition, countRef.current, loop);
			target.current = { index: next, position: targetPosition };
			if (next !== indexRef.current) setSelected(next);
			requestReconcile();
		},
		[loop, setSelected]
	);

	const handleTick = useCallback(() => {
		const { next, stop } = resolveAutoplayNext(indexRef.current, countRef.current, loop);
		if (stop) return true;
		go(next, true);
		return !loop && next >= countRef.current - 1;
	}, [go, loop]);

	const { stop: stopAutoplay } = useCarouselAutoplay({
		autoplay,
		count,
		interval: autoplayInterval,
		isCalm,
		isDisabled,
		onTick: handleTick,
	});

	const scrollTo = useCallback(
		(next: number, options?: { animated?: boolean }) => {
			stopAutoplay();
			go(next, options?.animated ?? true);
		},
		[go, stopAutoplay]
	);

	const navigation = resolveNavigationState(index, count, loop);

	const previous = useCallback(() => {
		stopAutoplay();
		go(indexRef.current - 1, true);
	}, [go, stopAutoplay]);

	const next = useCallback(() => {
		stopAutoplay();
		go(indexRef.current + 1, true);
	}, [go, stopAutoplay]);

	const context = useMemo<CarouselContextValue>(
		() => ({
			canGoNext: navigation.canGoNext,
			canGoPrevious: navigation.canGoPrevious,
			count,
			index,
			next,
			orientation,
			previous,
			scrollTo,
		}),
		[count, index, navigation.canGoNext, navigation.canGoPrevious, next, orientation, previous, scrollTo]
	);

	const options = useMemo<CarouselOptionsValue>(
		() => ({
			accessibilityLabel,
			gap,
			isCalm,
			isDisabled,
			isScrollEnabled,
			itemSize,
			loop,
			orientation,
			setCount,
			variant,
			windowSize,
		}),
		[accessibilityLabel, gap, isCalm, isDisabled, isScrollEnabled, itemSize, loop, orientation, variant, windowSize]
	);

	const motion = useMemo<CarouselMotionValue>(
		() => ({ commitFromPan, geometry, position, stopAutoplay }),
		[commitFromPan, geometry, position, stopAutoplay]
	);

	return (
		<CarouselOptionsProvider value={options}>
			<CarouselProvider value={context}>
				<CarouselMotionProvider value={motion}>
					<View className={carouselVariants({ orientation, variant }).root({ className })} testID={testID}>
						{children}
					</View>
				</CarouselMotionProvider>
			</CarouselProvider>
		</CarouselOptionsProvider>
	);
}

/**
 * A swipeable run of slides on one fractional position — peeking, looping,
 * vertical, autoplaying, with dots, arrows and captions as optional parts.
 *
 * The whole component is one shared value: a float slide index. A drag writes it,
 * a spring settles it, and every slide, dot and caption is a reading of it. So
 * peek, loop, vertical and coverflow are the same code with different transforms,
 * and nothing can drift a frame out of step.
 *
 * **Slides are `Carousel.Item`s, direct children of `Carousel.Content`**, and their
 * source order is the order of record. It holds a handful of hand-written slides,
 * not a feed — a feed is a list.
 *
 * State works either way: pass `index` with `onIndexChange` to control it, or
 * `defaultIndex` and let it hold its own. `onIndexChange` fires once per gesture.
 *
 * @example
 * <Carousel accessibilityLabel="Featured" itemSize={280} loop>
 *   <Carousel.Content aspectRatio={1.4}>
 *     {photos.map((photo) => (
 *       <Carousel.Item key={photo.id}>
 *         <Image className="size-full" source={photo.source} />
 *         <Carousel.Caption>{photo.title}</Carousel.Caption>
 *       </Carousel.Item>
 *     ))}
 *   </Carousel.Content>
 *   <Carousel.Controls>
 *     <Carousel.Previous />
 *     <Carousel.Dots />
 *     <Carousel.Next />
 *   </Carousel.Controls>
 * </Carousel>
 */
export const Carousel = Object.assign(CarouselRoot, {
	/** The clipped viewport, the pan and the adjustable element. Holds the `Carousel.Item`s. */
	Content: CarouselContent,
	/** One slide. Must be a direct child of `Carousel.Content`. */
	Item: CarouselItem,
	/** A slide's caption, pinned to its foot. Visible only while its slide is active. */
	Caption: CarouselCaption,
	/** One dot per slide, the active one a pill. Decoration: hidden from assistive tech. */
	Dots: CarouselDots,
	/** Moves back a slide. Disabled at the start unless looping. */
	Previous: CarouselPrevious,
	/** Moves on a slide. Disabled at the end unless looping. */
	Next: CarouselNext,
	/** A row for Previous · Dots · Next — a column when vertical. */
	Controls: CarouselControls,
	displayName: "DelacourUI.Carousel",
});
