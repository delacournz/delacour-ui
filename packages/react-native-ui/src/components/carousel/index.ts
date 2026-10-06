export { Carousel, type CarouselProps } from "./carousel";
export {
	type CarouselContextValue,
	type CarouselGeometry,
	CarouselMotionProvider,
	type CarouselMotionValue,
	CarouselOptionsProvider,
	type CarouselOptionsValue,
	CarouselProvider,
	CarouselSlideProvider,
	type CarouselSlideValue,
	useCarousel,
	useCarouselContext,
} from "./carousel.context";
export type { CarouselArrowProps, CarouselSlotProps } from "./carousel.types";
export {
	CAROUSEL_CALM_DURATION_MS,
	CAROUSEL_DEFAULT_AUTOPLAY_INTERVAL_MS,
	CAROUSEL_DEFAULT_MAX_DOTS,
	CAROUSEL_DEFAULT_WINDOW_SIZE,
	CAROUSEL_DOT_ACTIVE_POINTS,
	CAROUSEL_DOT_POINTS,
	CAROUSEL_DOT_TONES,
	CAROUSEL_GAP_POINTS,
	CAROUSEL_ORIENTATIONS,
	CAROUSEL_PAN,
	CAROUSEL_SPRING,
	CAROUSEL_VARIANTS,
	type CarouselDotTone,
	type CarouselOrientation,
	type CarouselVariant,
	type CarouselVariantProps,
	COVERFLOW_MIN_OPACITY,
	COVERFLOW_MIN_SCALE,
	COVERFLOW_PERSPECTIVE,
	COVERFLOW_ROTATE_DEG,
	carouselVariants,
	resolveAutoplayEnabled,
	resolveAutoplayNext,
	resolveCaptionOpacity,
	resolveCarouselA11yValue,
	resolveClampedIndex,
	resolveCoverflow,
	resolveDotLength,
	resolveDotsWindow,
	resolveItemInset,
	resolveItemPitch,
	resolveItemSize,
	resolveNavigationState,
	resolveSlideAccessibility,
	resolveSlideTranslate,
} from "./carousel.variants";
export type { CarouselCaptionProps } from "./carousel-caption";
export type { CarouselContentProps } from "./carousel-content";
export type { CarouselControlsProps } from "./carousel-controls";
export type { CarouselDotsProps } from "./carousel-dots";
export type { CarouselItemProps } from "./carousel-item";
