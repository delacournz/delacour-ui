import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { CarouselOrientation, CarouselVariant } from "./carousel.variants";

/** What `useCarousel()` returns: the committed slide, and the ways to move it. */
export type CarouselContextValue = {
	/** The committed slide, clamped into the run. Changes once per gesture, never per frame. */
	index: number;
	/** How many `Carousel.Item`s `Carousel.Content` holds. */
	count: number;
	orientation: CarouselOrientation;
	/** Whether `previous()` has anywhere to go. Always true when looping more than one slide. */
	canGoPrevious: boolean;
	/** Whether `next()` has anywhere to go. Always true when looping more than one slide. */
	canGoNext: boolean;
	/** Moves to `index` — the short way round when looping. `animated: false` jumps. */
	scrollTo: (index: number, options?: { animated?: boolean }) => void;
	previous: () => void;
	next: () => void;
};

/**
 * The carousel's options: the props a part reads and nothing that moves.
 *
 * Changes only when the caller changes a prop, so a part reading it does not
 * re-render when the slide changes.
 */
export type CarouselOptionsValue = {
	variant: CarouselVariant;
	orientation: CarouselOrientation;
	loop: boolean;
	itemSize?: number;
	gap: number;
	windowSize: number;
	isDisabled: boolean;
	isScrollEnabled: boolean;
	/** Reduce motion, or the app's `isMotionCalm`: settles by timing and drops the coverflow turn. */
	isCalm: boolean;
	accessibilityLabel?: string;
	/** `Carousel.Content` reports how many slides it holds. Stable for the carousel's lifetime. */
	setCount: (count: number) => void;
};

/** The slide geometry along the travel axis, in points. All zero until the viewport is measured. */
export type CarouselGeometry = {
	/** The viewport's length along the axis. */
	viewport: number;
	/** One slide's length along the axis. */
	size: number;
	/** Slide plus gap: how far `position` moving by one moves a slide. */
	pitch: number;
	/** The offset that centres the active slide when it is smaller than the viewport. */
	inset: number;
};

/**
 * The Reanimated layer. Every field is a shared value or a callback that is
 * stable for the carousel's lifetime, so this bundle never invalidates and
 * nothing reading it re-renders for a slide change.
 */
export type CarouselMotionValue = {
	/**
	 * Where the run sits, as a float slide index, on the **UI thread** — the whole
	 * component. Every slide, dot and caption is a reading of it. Unbounded when
	 * looping: positions a whole run apart draw identically.
	 */
	position: SharedValue<number>;
	geometry: SharedValue<CarouselGeometry>;
	/** The pan's settle calls this with the position it is springing to. */
	commitFromPan: (targetPosition: number) => void;
	/** Autoplay stops for good on the first touch. */
	stopAutoplay: () => void;
};

/** One slide's place in the run, given to it by `Carousel.Content`. */
export type CarouselSlideValue = {
	index: number;
	/** Whether this is the committed slide. */
	isActive: boolean;
	/** Whether neighbours are visible beside the active slide, which keeps them reachable. */
	isPeek: boolean;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);
const CarouselOptionsContext = createContext<CarouselOptionsValue | null>(null);
const CarouselMotionContext = createContext<CarouselMotionValue | null>(null);
const CarouselSlideContext = createContext<CarouselSlideValue | null>(null);

/**
 * Supplies the committed slide and its actions.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./carousel` — which would close a cycle.
 */
export function CarouselProvider({
	value,
	children,
}: {
	value: CarouselContextValue;
	children: ReactNode;
}): ReactElement {
	return <CarouselContext value={value}>{children}</CarouselContext>;
}
CarouselProvider.displayName = "DelacourUI.Carousel.Provider";

/** Supplies the options. Split from the index so a slide change re-renders nothing that only reads props. */
export function CarouselOptionsProvider({
	value,
	children,
}: {
	value: CarouselOptionsValue;
	children: ReactNode;
}): ReactElement {
	return <CarouselOptionsContext value={value}>{children}</CarouselOptionsContext>;
}
CarouselOptionsProvider.displayName = "DelacourUI.Carousel.OptionsProvider";

/** Supplies the Reanimated layer. Memoised once and never invalidated. */
export function CarouselMotionProvider({
	value,
	children,
}: {
	value: CarouselMotionValue;
	children: ReactNode;
}): ReactElement {
	return <CarouselMotionContext value={value}>{children}</CarouselMotionContext>;
}
CarouselMotionProvider.displayName = "DelacourUI.Carousel.MotionProvider";

/** Supplies one slide's index to the slide and its caption. */
export function CarouselSlideProvider({
	value,
	children,
}: {
	value: CarouselSlideValue;
	children: ReactNode;
}): ReactElement {
	return <CarouselSlideContext value={value}>{children}</CarouselSlideContext>;
}
CarouselSlideProvider.displayName = "DelacourUI.Carousel.Item.Provider";

/** The enclosing carousel's slide and actions, or null outside a `<Carousel>`. */
export function useCarouselContext(): CarouselContextValue | null {
	return use(CarouselContext);
}

/**
 * Reads the enclosing carousel's committed slide and the ways to move it.
 *
 * For a custom control — a counter, a "skip" button, external dots. Throws
 * outside a `<Carousel>`; use {@link useCarouselContext} where it is optional.
 */
export function useCarousel(): CarouselContextValue {
	const context = useCarouselContext();
	if (!context) {
		throw new Error("useCarousel must be called inside a <Carousel>.");
	}
	return context;
}

/** The enclosing carousel's state, for a part that cannot work without one. Internal. */
export function useCarouselPart(component: string): CarouselContextValue {
	const context = useCarouselContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Carousel>.`);
	}
	return context;
}

/** The enclosing carousel's options, for a part that cannot work without one. Internal. */
export function useCarouselOptionsPart(component: string): CarouselOptionsValue {
	const context = use(CarouselOptionsContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Carousel>.`);
	}
	return context;
}

/** The enclosing carousel's Reanimated layer, for a part that cannot work without one. Internal. */
export function useCarouselMotionPart(component: string): CarouselMotionValue {
	const context = use(CarouselMotionContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Carousel>.`);
	}
	return context;
}

/** The enclosing slide, for a part that cannot work without one. Internal. */
export function useCarouselSlidePart(component: string): CarouselSlideValue {
	const context = use(CarouselSlideContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Carousel.Item>.`);
	}
	return context;
}
