import { type ReactElement, useCallback, useState } from "react";
import { View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { IconImages1 } from "../../icons/central";
import { Icon } from "../icon";
import { Text } from "../text";
import type { ImageViewerImage, ImageViewerRenderImage } from "./image-viewer.types";
import {
	imageViewerVariants,
	resolveCornerRadiusAt,
	resolveDismissScale,
	resolveFrameAt,
	VIEWER_FADE_DURATION_MS,
	type ViewerRect,
} from "./image-viewer.variants";
import { ImageViewerImageView } from "./image-viewer-image";

/** The shared values a page reads. One bundle, owned by the layer, never invalidated. */
export type ImageViewerPageMotion = {
	/** The gallery's fractional position: page `i` sits at `(i - position) * pitch`. */
	position: SharedValue<number>;
	/** The flight: 0 at the thumbnail's frame, 1 at rest. */
	progress: SharedValue<number>;
	/** The thumbnail's frame to fly from or to. `null`: there is none, so the page rests at its fitted rect. */
	origin: SharedValue<ViewerRect | null>;
	/** The corner the image wears at the thumbnail's frame. */
	cornerRadius: SharedValue<number>;
	/** The active page's zoom. A neighbour is always at rest. */
	scale: SharedValue<number>;
	translateX: SharedValue<number>;
	translateY: SharedValue<number>;
	/** The drag away, in points. */
	dismissY: SharedValue<number>;
	/** The small shrink a fade-out close adds. */
	exitScale: SharedValue<number>;
};

export type ImageViewerPageProps = {
	image: ImageViewerImage;
	pageIndex: number;
	isActive: boolean;
	/** This page's rest frame, in window coordinates. */
	fitted: ViewerRect;
	pitch: number;
	windowHeight: number;
	isCalm: boolean;
	motion: ImageViewerPageMotion;
	renderImage?: ImageViewerRenderImage;
	/** Reports the image's intrinsic aspect once it decodes. */
	onAspect: (id: string, aspect: number) => void;
	/** The thumbnail has drawn, or failed: the opening flight may start. */
	onBaseLoad: (id: string) => void;
};

/** Both image layers fill the flying frame. */
const FILL = { height: "100%", left: 0, position: "absolute", top: 0, width: "100%" } as const;

/**
 * One image of the gallery, placed by `position` the way a carousel slide is.
 *
 * **The image flies by frame, not by scale.** A clipping view animates its
 * `left`/`top`/`width`/`height` from the thumbnail's frame to the fitted rect,
 * with the image `cover` inside — so a thumbnail that crops never squashes into
 * the wrong aspect mid-flight, and at rest cover equals contain because the
 * frame has the image's own aspect. Only this one absolutely placed view
 * animates layout, so no sibling is dirtied.
 *
 * **The thumbnail is the base layer**: known instantly and already decoded, it
 * draws from the first frame; `fullSource` fades in over it when it loads and is
 * simply dropped if it fails. Only a failed thumbnail, with nothing beneath it,
 * shows the error.
 */
export function ImageViewerPage({
	image,
	pageIndex,
	isActive,
	fitted,
	pitch,
	windowHeight,
	isCalm,
	motion,
	renderImage,
	onAspect,
	onBaseLoad,
}: ImageViewerPageProps): ReactElement {
	const { cornerRadius, dismissY, exitScale, origin, position, progress, scale, translateX, translateY } = motion;
	const [hasBaseError, setBaseError] = useState(false);
	const [hasFullError, setFullError] = useState(false);
	const fullOpacity = useSharedValue(0);

	const { height: fittedHeight, width: fittedWidth, x: fittedX, y: fittedY } = fitted;

	const pageStyle = useAnimatedStyle(
		() => ({ transform: [{ translateX: (pageIndex - position.value) * pitch }] }),
		[pageIndex, pitch]
	);

	const frameStyle = useAnimatedStyle(() => {
		const rest = { height: fittedHeight, width: fittedWidth, x: fittedX, y: fittedY };
		const p = isActive ? progress.value : 1;
		const from = origin.value ?? rest;
		const frame = resolveFrameAt(p, from, rest);
		const drag = isActive ? dismissY.value : 0;
		const zoom = isActive ? scale.value : 1;
		return {
			borderRadius: resolveCornerRadiusAt(p, cornerRadius.value),
			height: frame.height,
			left: frame.x,
			top: frame.y,
			transform: [
				{ translateX: isActive ? translateX.value : 0 },
				{ translateY: (isActive ? translateY.value : 0) + drag },
				{ scale: zoom * resolveDismissScale(drag, windowHeight) * (isActive ? exitScale.value : 1) },
			],
			width: frame.width,
		};
	}, [fittedHeight, fittedWidth, fittedX, fittedY, isActive, windowHeight]);

	const fullStyle = useAnimatedStyle(() => ({ opacity: fullOpacity.value }));

	const id = image.id;
	const hasIntrinsicSize = image.width !== undefined && image.height !== undefined;

	const handleBaseLoad = useCallback(
		(size: { width: number; height: number }) => {
			if (!hasIntrinsicSize && size.height > 0) onAspect(id, size.width / size.height);
			onBaseLoad(id);
		},
		[hasIntrinsicSize, id, onAspect, onBaseLoad]
	);

	const handleFullLoad = useCallback(
		(size: { width: number; height: number }) => {
			if (!hasIntrinsicSize && size.height > 0) onAspect(id, size.width / size.height);
			fullOpacity.value = isCalm ? 1 : withTiming(1, { duration: VIEWER_FADE_DURATION_MS });
		},
		[fullOpacity, hasIntrinsicSize, id, isCalm, onAspect]
	);

	const handleBaseError = useCallback(() => {
		setBaseError(true);
		onBaseLoad(id);
	}, [id, onBaseLoad]);
	const handleFullError = useCallback(() => setFullError(true), []);

	const slots = imageViewerVariants();

	return (
		<Animated.View
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={[{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }, pageStyle]}
			testID={`image-viewer-page-${pageIndex}`}
		>
			<Animated.View style={[{ overflow: "hidden", position: "absolute" }, frameStyle]}>
				{hasBaseError ? null : (
					<ImageViewerImageView
						alt={image.alt}
						onError={handleBaseError}
						onLoad={handleBaseLoad}
						renderImage={renderImage}
						resizeMode="cover"
						source={image.source}
						style={FILL}
					/>
				)}
				{image.fullSource && !hasFullError ? (
					<Animated.View style={[FILL, fullStyle]}>
						<ImageViewerImageView
							alt={image.alt}
							onError={handleFullError}
							onLoad={handleFullLoad}
							renderImage={renderImage}
							resizeMode="cover"
							source={image.fullSource}
							style={FILL}
						/>
					</Animated.View>
				) : null}
			</Animated.View>
			{hasBaseError && (!image.fullSource || hasFullError) ? (
				<View className={slots.error()}>
					<Icon color="media-foreground" icon={IconImages1} size="lg" />
					<Text className={slots.errorText()}>This image could not be loaded</Text>
				</View>
			) : null}
		</Animated.View>
	);
}
ImageViewerPage.displayName = "DelacourUI.ImageViewer.Page";
