import {
	type ComponentRef,
	type ReactElement,
	type ReactNode,
	useCallback,
	useId,
	useLayoutEffect,
	useRef,
} from "react";
import { AccessibilityInfo, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import { cn } from "../../lib/cn";
import { Pressable, type PressableProps } from "../pressable";
import { useImageViewerInternalPart } from "./image-viewer.context";
import type { ImageViewerImage } from "./image-viewer.types";
import { imageViewerVariants } from "./image-viewer.variants";
import { ImageViewerImageView } from "./image-viewer-image";

type ImageViewerTriggerBaseProps = Omit<PressableProps, "onPress" | "children" | "asChild" | "disabled"> & {
	/** A custom thumbnail. Default: the image, drawn `cover` at the Trigger's size. */
	children?: ReactNode;
	/** The thumbnail's corner, in points. Also where the flight's corner starts. Default: the className's own. */
	radius?: number;
	className?: string;
};

type ImageViewerTriggerComposedProps = { index?: undefined } & ImageViewerImage;

type ImageViewerTriggerDataProps = {
	/** Data mode: the root's `images[index]`. */
	index: number;
	id?: never;
	source?: never;
	fullSource?: never;
	alt?: never;
	caption?: never;
	width?: never;
	height?: never;
};

export type ImageViewerTriggerProps = ImageViewerTriggerBaseProps &
	(ImageViewerTriggerComposedProps | ImageViewerTriggerDataProps);

/** The thumbnail fills its Trigger, under any corner the Trigger clips to. */
const FILL = { height: "100%", width: "100%" } as const;

/**
 * Custom children size the Trigger themselves, so their wrapper takes the width
 * only: a percentage height on a content-sized Trigger resolves against its
 * parent and stretched a card to the full screen.
 */
const WRAP = { width: "100%" } as const;

/** No-op load and error handlers for a thumbnail, which reports nothing. */
const ignore = (): void => {};

/**
 * A thumbnail that opens the viewer at its own image, and the frame the image
 * flies out of and back into.
 *
 * **Two modes, told apart by `index`.** Without it the Trigger IS the image —
 * `id`, `source`, `alt` and the rest — and registers itself, so the gallery is
 * every mounted Trigger in mount order. With it the Trigger points at the root's
 * `images[index]`, which is what a virtualised list needs: its Triggers unmount
 * as they scroll away, and a gallery built from them would shrink.
 *
 * In both modes it registers its frame under the image's `id`, measured in the
 * window when the viewer opens and again when it closes — so a Trigger scrolled
 * since still receives its image, and one scrolled out of sight gets a fade.
 */
export function ImageViewerTrigger(props: ImageViewerTriggerProps): ReactElement {
	const {
		index,
		id: _id,
		source: _source,
		fullSource: _fullSource,
		alt: _alt,
		caption: _caption,
		width: _width,
		height: _height,
		children,
		radius,
		className,
		testID,
		accessibilityHint = "Opens full screen image viewer",
		...pressableProps
	} = props;
	const { images, isDataMode, isDisabled, openById, register, registerTarget, renderImage, unregister } =
		useImageViewerInternalPart("ImageViewer.Trigger");

	const image: ImageViewerImage | undefined =
		props.index === undefined
			? {
					alt: props.alt,
					caption: props.caption,
					fullSource: props.fullSource,
					height: props.height,
					id: props.id,
					source: props.source,
					width: props.width,
				}
			: images[props.index];

	if (process.env.NODE_ENV !== "production" && index === undefined && isDataMode) {
		console.warn("ImageViewer.Trigger: the root has `images`, so a Trigger needs `index` rather than its own image.");
	}

	const token = useId();

	// Every commit, deliberately without deps: `register` compares by value, so a
	// fresh `{ uri }` literal is not a change, and only a real one re-renders the root.
	useLayoutEffect(() => {
		if (index === undefined && image) register(token, image);
	});

	useLayoutEffect(() => () => unregister(token), [token, unregister]);

	const ref = useRef<ComponentRef<typeof View>>(null);
	const classRadius = useResolveClassNames(className ?? "").borderRadius;
	const resolvedRadius = radius ?? Number(classRadius ?? 0);
	const radiusRef = useRef(resolvedRadius);
	radiusRef.current = Number.isFinite(resolvedRadius) ? resolvedRadius : 0;

	const imageId = image?.id;
	useLayoutEffect(() => {
		if (imageId === undefined) return;
		return registerTarget(imageId, {
			focus: () => {
				const node = ref.current;
				if (node) AccessibilityInfo.sendAccessibilityEvent(node, "focus");
			},
			measure: (callback) => {
				const node = ref.current;
				if (!node) {
					callback(null);
					return;
				}
				node.measureInWindow((x, y, width, height) => {
					callback({ radius: radiusRef.current, rect: { height, width, x, y } });
				});
			},
		});
	}, [imageId, registerTarget]);

	const handlePress = useCallback(() => {
		if (imageId !== undefined) openById(imageId);
	}, [imageId, openById]);

	const slots = imageViewerVariants();

	return (
		<Pressable
			accessibilityHint={accessibilityHint}
			accessibilityLabel={image?.alt}
			accessibilityRole="imagebutton"
			className={slots.trigger({ className: cn(className) })}
			disabled={isDisabled || !image}
			feedback="scale"
			haptic="selection"
			onPress={handlePress}
			testID={testID ?? (imageId !== undefined ? `image-viewer-trigger-${imageId}` : undefined)}
			{...pressableProps}
		>
			<View
				collapsable={false}
				ref={ref}
				style={[
					children === undefined ? FILL : WRAP,
					radius !== undefined ? { borderRadius: radius, overflow: "hidden" } : null,
				]}
			>
				{children ??
					(image ? (
						<ImageViewerImageView
							alt={image.alt}
							onError={ignore}
							onLoad={ignore}
							renderImage={renderImage}
							resizeMode="cover"
							source={image.source}
							style={FILL}
						/>
					) : null)}
			</View>
		</Pressable>
	);
}
ImageViewerTrigger.displayName = "DelacourUI.ImageViewer.Trigger";
