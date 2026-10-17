import {
	type ComponentRef,
	type ReactElement,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type AccessibilityActionEvent,
	AccessibilityInfo,
	Modal,
	StatusBar,
	useWindowDimensions,
	View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { resolvePanOrigin, resolvePanPosition, resolveSettleTarget, resolveVisibleRange } from "../../lib/paging";
import type { ImageViewerOrigin } from "./image-viewer.context";
import type { ImageViewerImage, ImageViewerRenderImage } from "./image-viewer.types";
import {
	imageViewerVariants,
	resolveBackdropOpacity,
	resolveClampedTranslation,
	resolveCloseTarget,
	resolveDismissDecision,
	resolveDoubleTapTarget,
	resolveDragAxis,
	resolveFittedRect,
	resolveNextZoomStep,
	resolveOriginVisible,
	resolvePinchTransform,
	resolvePreviousZoomStep,
	resolveTranslateBounds,
	resolveViewerA11yValue,
	VIEWER_CLOSE_DURATION_MS,
	VIEWER_FADE_DURATION_MS,
	VIEWER_LOAD_WAIT_MS,
	VIEWER_PAGE_GAP_POINTS,
	VIEWER_PAN_ACTIVATE,
	VIEWER_SPRING,
	VIEWER_ZOOMED_THRESHOLD,
	type ViewerRect,
} from "./image-viewer.variants";
import { ImageViewerChrome } from "./image-viewer-chrome";
import { ImageViewerPage, type ImageViewerPageMotion } from "./image-viewer-page";

export type ImageViewerLayerProps = {
	images: readonly ImageViewerImage[];
	index: number;
	isOpen: boolean;
	/** The Trigger's frame and corner when it opened. `null`: no Trigger, so it fades in. */
	origin: ImageViewerOrigin | null;
	maxScale: number;
	doubleTapScale: number;
	isDismissible: boolean;
	showsChrome: boolean;
	/** Overrides the Trigger's own corner for the flight. */
	cornerRadius?: number;
	renderImage?: ImageViewerRenderImage;
	/** Measures the Trigger of the image at `index` now — for the flight home. */
	measureOrigin: (index: number, callback: (origin: ImageViewerOrigin | null) => void) => void;
	onIndexChange: (index: number) => void;
	onClose: () => void;
	/** The close animation finished: unmount the layer. */
	onExited: () => void;
};

/** Pan modes, decided once per gesture. Numbers, because a worklet compares them every frame. */
const MODE_NONE = 0;
const MODE_PAGE = 1;
const MODE_DISMISS = 2;
const MODE_ZOOM = 3;

const ZOOM_ACTIONS = [
	{ label: "Next image", name: "increment" },
	{ label: "Previous image", name: "decrement" },
	{ label: "Zoom in", name: "zoomIn" },
	{ label: "Zoom out", name: "zoomOut" },
	{ label: "Reset zoom", name: "resetZoom" },
];

const ABSOLUTE_FILL = { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 } as const;

/**
 * The full-screen layer: a React Native `Modal` holding the backdrop, the pages,
 * the chrome and one gesture surface. Internal — the root renders it while open
 * and through its close animation.
 *
 * **A `Modal` is its own native window, so two providers are re-supplied inside
 * it.** Gesture Handler does not cross that boundary on Android, so a
 * `GestureHandlerRootView` is rendered inside; and the safe-area insets are read
 * out here, before the Modal, and handed back in through `SafeAreaInsetsContext`.
 *
 * **One `GestureDetector`, one set of zoom values.** Only the active page can be
 * zoomed — paging requires scale 1 — so the zoom lives here, not per page, and
 * is reset whenever the page changes. Pinch and the one-finger pan run together;
 * that group races the taps, double before single.
 *
 * The pan decides its job once, at activation: zoomed, it pans the image;
 * otherwise the first axis past the threshold wins — horizontal pages, vertical
 * drags away. A drag that started paging never becomes a dismiss.
 */
export function ImageViewerLayer({
	images,
	index,
	isOpen,
	origin: openOrigin,
	maxScale,
	doubleTapScale,
	isDismissible,
	showsChrome,
	cornerRadius,
	renderImage,
	measureOrigin,
	onIndexChange,
	onClose,
	onExited,
}: ImageViewerLayerProps): ReactElement {
	const insets = useSafeAreaInsets();
	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const isCalm = useCalmMotion();
	const count = images.length;
	const pitch = windowWidth + VIEWER_PAGE_GAP_POINTS;

	const progress = useSharedValue(0);
	const fade = useSharedValue(0);
	const exitScale = useSharedValue(1);
	const origin = useSharedValue<ViewerRect | null>(openOrigin?.rect ?? null);
	const corner = useSharedValue(cornerRadius ?? openOrigin?.radius ?? 0);
	const position = useSharedValue(index);
	const scale = useSharedValue(1);
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const dismissY = useSharedValue(0);
	const chrome = useSharedValue(1);
	const activeFitted = useSharedValue<ViewerRect>({ height: 0, width: 0, x: 0, y: 0 });

	const [isChromeVisible, setChromeVisible] = useState(true);
	const [aspects, setAspects] = useState<Record<string, number>>({});

	const handleAspect = useCallback((id: string, aspect: number) => {
		setAspects((current) => (current[id] === aspect ? current : { ...current, [id]: aspect }));
	}, []);

	const openAspect = openOrigin && openOrigin.rect.height > 0 ? openOrigin.rect.width / openOrigin.rect.height : 0;
	const openIndex = useRef(index).current;

	const fittedFor = useCallback(
		(image: ImageViewerImage, pageIndex: number): ViewerRect => {
			const intrinsic = image.width && image.height ? image.width / image.height : undefined;
			const aspect = intrinsic ?? aspects[image.id] ?? (pageIndex === openIndex ? openAspect : 0);
			return resolveFittedRect(aspect, { height: windowHeight, width: windowWidth }, insets);
		},
		[aspects, insets, openAspect, openIndex, windowHeight, windowWidth]
	);

	const activeImage = images[index];
	const activeRect = activeImage ? fittedFor(activeImage, index) : null;

	useLayoutEffect(() => {
		if (activeRect) activeFitted.value = activeRect;
	}, [activeFitted, activeRect]);

	// The entrance, run once per open. The flight waits for the active page's
	// thumbnail to decode — a fresh `Image` of a remote source draws nothing for a
	// few frames even when the Trigger beside it is showing, and a spring started
	// at once flies an empty frame and pops the photo in at rest. The wait is
	// capped, so a slow or failed load still opens.
	const hasEntered = useRef(false);
	const enter = useCallback(() => {
		if (hasEntered.current) return;
		hasEntered.current = true;
		cancelAnimation(exitScale);
		exitScale.value = 1;
		if (isCalm || origin.value === null) {
			progress.value = 1;
			fade.value = withTiming(1, { duration: VIEWER_FADE_DURATION_MS });
		} else {
			fade.value = 1;
			progress.value = withSpring(1, VIEWER_SPRING);
		}
	}, [exitScale, fade, isCalm, origin, progress]);

	const activeId = activeImage?.id;
	const handleBaseLoad = useCallback(
		(id: string) => {
			if (id === activeId) enter();
		},
		[activeId, enter]
	);

	// In and out. Keyed on `isOpen` alone: re-opening during the close simply
	// retargets the same values, and the interrupted close never calls `onExited`.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs on the open/close edge only; see above
	useEffect(() => {
		if (isOpen) {
			if (hasEntered.current || isCalm || origin.value === null) {
				hasEntered.current = false;
				enter();
				return undefined;
			}
			const timer = setTimeout(enter, VIEWER_LOAD_WAIT_MS);
			return () => clearTimeout(timer);
		}

		measureOrigin(index, (measured) => {
			const target = resolveCloseTarget({
				calm: isCalm,
				originVisible: resolveOriginVisible(measured?.rect ?? null, { height: windowHeight, width: windowWidth }),
			});
			const timing = { duration: VIEWER_CLOSE_DURATION_MS, easing: Easing.out(Easing.cubic) };
			const finish = (finished?: boolean) => {
				"worklet";
				if (finished) scheduleOnRN(onExited);
			};

			scale.value = withTiming(1, timing);
			translateX.value = withTiming(0, timing);
			translateY.value = withTiming(0, timing);

			if (target === "origin" && measured) {
				origin.value = measured.rect;
				corner.value = cornerRadius ?? measured.radius;
				dismissY.value = withTiming(0, timing);
				progress.value = withTiming(0, timing, finish);
			} else {
				exitScale.value = withTiming(0.95, { duration: VIEWER_FADE_DURATION_MS });
				fade.value = withTiming(0, { duration: VIEWER_FADE_DURATION_MS }, finish);
			}
		});
		return undefined;
	}, [isOpen]);

	// The page changed: snap the zoom back (paging needs scale 1 anyway) and move
	// the run there unless the pan already did.
	const settledIndex = useRef(index);
	useEffect(() => {
		scale.value = 1;
		translateX.value = 0;
		translateY.value = 0;
		if (settledIndex.current === index) return;
		settledIndex.current = index;
		position.value = isCalm
			? withTiming(index, { duration: VIEWER_FADE_DURATION_MS })
			: withSpring(index, VIEWER_SPRING);
	}, [index, isCalm, position, scale, translateX, translateY]);

	const commitFromPan = useCallback(
		(target: number) => {
			settledIndex.current = target;
			if (target !== index) onIndexChange(target);
		},
		[index, onIndexChange]
	);

	const zoomTo = useCallback(
		(target: number) => {
			const timing = { duration: VIEWER_FADE_DURATION_MS };
			scale.value = isCalm ? withTiming(target, timing) : withSpring(target, VIEWER_SPRING);
			translateX.value = withTiming(0, timing);
			translateY.value = withTiming(0, timing);
		},
		[isCalm, scale, translateX, translateY]
	);

	const toggleChrome = useCallback(() => setChromeVisible((visible) => !visible), []);

	useEffect(() => {
		chrome.value = withTiming(isChromeVisible ? 1 : 0, { duration: VIEWER_FADE_DURATION_MS });
	}, [chrome, isChromeVisible]);

	const mode = useSharedValue(MODE_NONE);
	const panStart = useSharedValue({ position: 0, x: 0, y: 0 });
	const pinchStart = useSharedValue({ focalX: 0, focalY: 0, scale: 1, x: 0, y: 0 });

	const gesture = useMemo(() => {
		const window = { height: windowHeight, width: windowWidth };
		const settle = isCalm
			? (value: number) => {
					"worklet";
					return withTiming(value, { duration: VIEWER_FADE_DURATION_MS });
				}
			: (value: number) => {
					"worklet";
					return withSpring(value, VIEWER_SPRING);
				};

		const releaseZoom = () => {
			"worklet";
			const bounds = resolveTranslateBounds(scale.value, activeFitted.value, window);
			const rest = resolveClampedTranslation({ x: translateX.value, y: translateY.value }, bounds);
			translateX.value = settle(rest.x);
			translateY.value = settle(rest.y);
		};

		const releasePage = (velocity: number) => {
			"worklet";
			const destination = resolveSettleTarget({
				count,
				loop: false,
				pitch,
				position: position.value,
				startIndex: Math.round(panStart.value.position),
				velocity,
			});
			position.value = isCalm
				? withTiming(destination, { duration: VIEWER_FADE_DURATION_MS })
				: withSpring(destination, { ...VIEWER_SPRING, velocity: pitch > 0 ? -velocity / pitch : 0 });
			scheduleOnRN(commitFromPan, destination);
		};

		const releaseDismiss = (velocity: number) => {
			"worklet";
			if (resolveDismissDecision(dismissY.value, velocity, windowHeight) === "dismiss") scheduleOnRN(onClose);
			else dismissY.value = settle(0);
		};

		const release = (current: number, velocityX: number, velocityY: number) => {
			"worklet";
			if (current === MODE_ZOOM) releaseZoom();
			else if (current === MODE_PAGE) releasePage(velocityX);
			else if (current === MODE_DISMISS) releaseDismiss(velocityY);
		};

		const pan = Gesture.Pan()
			.maxPointers(1)
			.minDistance(VIEWER_PAN_ACTIVATE)
			.onStart((event) => {
				"worklet";
				if (scale.value > VIEWER_ZOOMED_THRESHOLD) {
					mode.value = MODE_ZOOM;
					cancelAnimation(translateX);
					cancelAnimation(translateY);
					panStart.value = {
						position: position.value,
						x: translateX.value - event.translationX,
						y: translateY.value - event.translationY,
					};
					return;
				}

				const axis = resolveDragAxis({
					activateAt: VIEWER_PAN_ACTIVATE / 2,
					translationX: event.translationX,
					translationY: event.translationY,
				});
				if (axis === "horizontal" && count > 0) {
					mode.value = MODE_PAGE;
					cancelAnimation(position);
					panStart.value = {
						position: resolvePanOrigin(position.value, event.translationX, pitch),
						x: 0,
						y: 0,
					};
				} else if (axis === "vertical" && isDismissible) {
					mode.value = MODE_DISMISS;
					cancelAnimation(dismissY);
					panStart.value = { position: position.value, x: 0, y: dismissY.value - event.translationY };
				} else {
					mode.value = MODE_NONE;
				}
			})
			.onUpdate((event) => {
				"worklet";
				if (mode.value === MODE_ZOOM) {
					const bounds = resolveTranslateBounds(scale.value, activeFitted.value, window);
					const next = resolveClampedTranslation(
						{ x: panStart.value.x + event.translationX, y: panStart.value.y + event.translationY },
						bounds,
						true
					);
					translateX.value = next.x;
					translateY.value = next.y;
				} else if (mode.value === MODE_PAGE) {
					position.value = resolvePanPosition({
						count,
						loop: false,
						pitch,
						start: panStart.value.position,
						translation: event.translationX,
					});
				} else if (mode.value === MODE_DISMISS) {
					dismissY.value = panStart.value.y + event.translationY;
				}
			})
			// `onFinalize`, the one callback on every path out, so a drag the OS
			// cancels still settles. Each mode's release is its own worklet.
			.onFinalize((event, success) => {
				"worklet";
				const current = mode.value;
				mode.value = MODE_NONE;
				release(current, success ? event.velocityX : 0, success ? event.velocityY : 0);
			});

		const pinch = Gesture.Pinch()
			.onStart((event) => {
				"worklet";
				cancelAnimation(scale);
				cancelAnimation(translateX);
				cancelAnimation(translateY);
				pinchStart.value = {
					focalX: event.focalX,
					focalY: event.focalY,
					scale: scale.value,
					x: translateX.value,
					y: translateY.value,
				};
			})
			.onUpdate((event) => {
				"worklet";
				const fitted = activeFitted.value;
				const start = pinchStart.value;
				const next = resolvePinchTransform({
					center: { x: fitted.x + fitted.width / 2, y: fitted.y + fitted.height / 2 },
					focal: { x: start.focalX, y: start.focalY },
					focalDelta: { x: event.focalX - start.focalX, y: event.focalY - start.focalY },
					maxScale,
					pinchScale: event.scale,
					startScale: start.scale,
					startTranslation: { x: start.x, y: start.y },
				});
				scale.value = next.scale;
				translateX.value = next.translation.x;
				translateY.value = next.translation.y;
			})
			.onFinalize(() => {
				"worklet";
				const target = scale.value < 1 ? 1 : scale.value > maxScale ? maxScale : scale.value;
				const bounds = resolveTranslateBounds(target, activeFitted.value, window);
				const rest = resolveClampedTranslation({ x: translateX.value, y: translateY.value }, bounds);
				scale.value = settle(target);
				translateX.value = settle(rest.x);
				translateY.value = settle(rest.y);
			});

		const doubleTap = Gesture.Tap()
			.numberOfTaps(2)
			.onEnd((event) => {
				"worklet";
				const fitted = activeFitted.value;
				const target = resolveDoubleTapTarget({
					bounds: resolveTranslateBounds(doubleTapScale, fitted, window),
					center: { x: fitted.x + fitted.width / 2, y: fitted.y + fitted.height / 2 },
					doubleTapScale,
					scale: scale.value,
					tap: { x: event.x, y: event.y },
				});
				scale.value = settle(target.scale);
				translateX.value = settle(target.translation.x);
				translateY.value = settle(target.translation.y);
			});

		const singleTap = Gesture.Tap().onEnd(() => {
			"worklet";
			scheduleOnRN(toggleChrome);
		});

		return Gesture.Race(Gesture.Simultaneous(pinch, pan), Gesture.Exclusive(doubleTap, singleTap));
	}, [
		activeFitted,
		commitFromPan,
		count,
		dismissY,
		doubleTapScale,
		isCalm,
		isDismissible,
		maxScale,
		mode,
		onClose,
		panStart,
		pinchStart,
		pitch,
		position,
		scale,
		toggleChrome,
		translateX,
		translateY,
		windowHeight,
		windowWidth,
	]);

	const backdropStyle = useAnimatedStyle(
		() => ({
			opacity:
				fade.value *
				(progress.value < 0 ? 0 : progress.value > 1 ? 1 : progress.value) *
				resolveBackdropOpacity(dismissY.value, windowHeight),
		}),
		[windowHeight]
	);

	const stageStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

	const pagerRef = useRef<ComponentRef<typeof View>>(null);
	useEffect(() => {
		const timer = setTimeout(() => {
			const node = pagerRef.current;
			if (node) AccessibilityInfo.sendAccessibilityEvent(node, "focus");
		}, VIEWER_CLOSE_DURATION_MS);
		return () => clearTimeout(timer);
	}, []);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			switch (event.nativeEvent.actionName) {
				case "increment":
					if (index < count - 1) onIndexChange(index + 1);
					return;
				case "decrement":
					if (index > 0) onIndexChange(index - 1);
					return;
				case "zoomIn":
					zoomTo(resolveNextZoomStep(scale.value, doubleTapScale, maxScale));
					return;
				case "zoomOut":
					zoomTo(resolvePreviousZoomStep(scale.value, doubleTapScale));
					return;
				case "resetZoom":
					zoomTo(1);
					return;
				default:
					return;
			}
		},
		[count, doubleTapScale, index, maxScale, onIndexChange, scale, zoomTo]
	);

	const motion = useMemo<ImageViewerPageMotion>(
		() => ({
			cornerRadius: corner,
			dismissY,
			exitScale,
			origin,
			position,
			progress,
			scale,
			translateX,
			translateY,
		}),
		[corner, dismissY, exitScale, origin, position, progress, scale, translateX, translateY]
	);

	const visible = resolveVisibleRange(index, count, false, 1);
	const slots = imageViewerVariants();
	const label = activeImage ? [activeImage.alt, activeImage.caption].filter(Boolean).join(". ") : undefined;

	return (
		<Modal
			animationType="none"
			onRequestClose={onClose}
			statusBarTranslucent
			supportedOrientations={["portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"]}
			transparent
			visible
		>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<SafeAreaInsetsContext.Provider value={insets}>
					<StatusBar animated barStyle="light-content" />
					<Animated.View className={slots.backdrop()} style={backdropStyle} />
					<GestureDetector gesture={gesture}>
						<Animated.View accessibilityViewIsModal style={[ABSOLUTE_FILL, stageStyle]}>
							<View
								accessibilityActions={ZOOM_ACTIONS}
								accessibilityLabel={label}
								accessibilityRole="adjustable"
								accessibilityValue={{ text: resolveViewerA11yValue(index, count) }}
								accessible
								onAccessibilityAction={handleAccessibilityAction}
								ref={pagerRef}
								style={ABSOLUTE_FILL}
							>
								{visible.map((pageIndex) => {
									const image = images[pageIndex];
									if (!image) return null;
									return (
										<ImageViewerPage
											fitted={fittedFor(image, pageIndex)}
											image={image}
											isActive={pageIndex === index}
											isCalm={isCalm}
											key={image.id}
											motion={motion}
											onAspect={handleAspect}
											onBaseLoad={handleBaseLoad}
											pageIndex={pageIndex}
											pitch={pitch}
											renderImage={renderImage}
											windowHeight={windowHeight}
										/>
									);
								})}
							</View>
							{showsChrome ? (
								<ImageViewerChrome
									caption={activeImage?.caption}
									chrome={chrome}
									count={count}
									dismissY={dismissY}
									fade={fade}
									index={index}
									insets={insets}
									isVisible={isChromeVisible}
									progress={progress}
									scale={scale}
									windowHeight={windowHeight}
								/>
							) : null}
						</Animated.View>
					</GestureDetector>
				</SafeAreaInsetsContext.Provider>
			</GestureHandlerRootView>
		</Modal>
	);
}
ImageViewerLayer.displayName = "DelacourUI.ImageViewer.Layer";
