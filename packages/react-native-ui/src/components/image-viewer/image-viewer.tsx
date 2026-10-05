import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import {
	type ImageViewerContextValue,
	ImageViewerInternalProvider,
	type ImageViewerInternalValue,
	type ImageViewerOrigin,
	ImageViewerProvider,
	type ImageViewerTarget,
} from "./image-viewer.context";
import type { ImageViewerImage, ImageViewerRenderImage } from "./image-viewer.types";
import {
	isSameImage,
	resolveGalleryOrder,
	resolveViewerIndex,
	VIEWER_DOUBLE_TAP_SCALE,
	VIEWER_MAX_SCALE,
} from "./image-viewer.variants";
import { ImageViewerClose } from "./image-viewer-close";
import { ImageViewerLayer } from "./image-viewer-layer";
import { ImageViewerTrigger } from "./image-viewer-trigger";

type ImageViewerStateProps =
	| {
			/** Whether the viewer is open, controlled. */
			open: boolean;
			defaultOpen?: never;
			onOpenChange: (open: boolean) => void;
	  }
	| {
			open?: undefined;
			/** Open on first render, while uncontrolled. Default `false`. */
			defaultOpen?: boolean;
			onOpenChange?: (open: boolean) => void;
	  };

type ImageViewerIndexProps =
	| {
			/** The image showing, controlled. */
			index: number;
			defaultIndex?: never;
			onIndexChange: (index: number) => void;
	  }
	| {
			index?: undefined;
			/** The image to start on, while uncontrolled. Default 0. */
			defaultIndex?: number;
			/** Called once per settled change — a Trigger's press, a swipe's release, never per frame. */
			onIndexChange?: (index: number) => void;
	  };

type ImageViewerCommonProps = {
	children?: ReactNode;
	/**
	 * Data mode: the gallery, independent of which Triggers are mounted — what a
	 * virtualised list needs. Omitted = composed mode: the gallery is whichever
	 * Triggers are mounted, in mount order.
	 */
	images?: readonly ImageViewerImage[];
	/** Draws every image instead of React Native's `Image` — an `expo-image`, say. */
	renderImage?: ImageViewerRenderImage;
	/** The furthest a pinch zooms. Default 4. */
	maxScale?: number;
	/** The zoom a double-tap toggles to. Default 2.5. */
	doubleTapScale?: number;
	/** Drag up or down to dismiss. The close button and Android back close either way. Default `true`. */
	isDismissible?: boolean;
	/** Triggers inert and announced disabled; `open()` does nothing. */
	isDisabled?: boolean;
	/** Close button, counter and caption over the image. Default `true`. */
	showsChrome?: boolean;
	/** The corner the image wears at the thumbnail's frame. Default: the Trigger's own. */
	cornerRadius?: number;
};

export type ImageViewerProps = ImageViewerCommonProps & ImageViewerStateProps & ImageViewerIndexProps;

type Registration = { image: ImageViewerImage; sequence: number };

/** The layer, while mounted: from the first open until its close animation ends. */
type LayerState = { origin: ImageViewerOrigin | null };

const EMPTY_IMAGES: readonly ImageViewerImage[] = [];

function ImageViewerRoot({
	children,
	images: imagesProp,
	renderImage,
	maxScale = VIEWER_MAX_SCALE,
	doubleTapScale = VIEWER_DOUBLE_TAP_SCALE,
	isDismissible = true,
	isDisabled = false,
	showsChrome = true,
	cornerRadius,
	open: openProp,
	defaultOpen,
	onOpenChange,
	index: indexProp,
	defaultIndex,
	onIndexChange,
}: ImageViewerProps): ReactElement {
	const [isOpen, setOpen] = useControllableState<boolean>({
		value: openProp,
		defaultValue: defaultOpen ?? false,
		onChange: onOpenChange,
	});
	const [selected, setSelected] = useControllableState<number>({
		value: indexProp,
		defaultValue: defaultIndex ?? 0,
		onChange: onIndexChange,
	});

	// Composed mode's registry. A ref, read when `version` moves: a Trigger
	// registering on every commit must not re-render the root unless it changed.
	const registrations = useRef(new Map<string, Registration>());
	const sequence = useRef(0);
	const [version, bump] = useState(0);
	const targets = useRef(new Map<string, ImageViewerTarget>());

	const register = useCallback((token: string, image: ImageViewerImage) => {
		const existing = registrations.current.get(token);
		if (existing && isSameImage(existing.image, image)) return;
		sequence.current += 1;
		registrations.current.set(token, { image, sequence: existing?.sequence ?? sequence.current });
		bump((n) => n + 1);
	}, []);

	const unregister = useCallback((token: string) => {
		if (registrations.current.delete(token)) bump((n) => n + 1);
	}, []);

	const registerTarget = useCallback((id: string, target: ImageViewerTarget) => {
		targets.current.set(id, target);
		return () => {
			if (targets.current.get(id) === target) targets.current.delete(id);
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the re-read token for the registry ref
	const composed = useMemo(() => resolveGalleryOrder([...registrations.current.values()]), [version]);
	const images = imagesProp ?? (composed.length > 0 ? composed : EMPTY_IMAGES);
	const count = images.length;
	const index = resolveViewerIndex(selected, count);

	const imagesRef = useRef(images);
	imagesRef.current = images;
	const indexRef = useRef(index);
	indexRef.current = index;

	const measureOrigin = useCallback((at: number, callback: (origin: ImageViewerOrigin | null) => void) => {
		const image = imagesRef.current[at];
		const target = image ? targets.current.get(image.id) : undefined;
		if (!target) callback(null);
		else target.measure(callback);
	}, []);

	const [layer, setLayer] = useState<LayerState | null>(null);
	const isMeasuring = useRef(false);

	// Open: measure the Trigger, then mount the layer at its frame. A gallery
	// emptied while open closes it rather than leave a viewer of nothing.
	useEffect(() => {
		if (!isOpen || layer || isMeasuring.current) return;
		if (count === 0) {
			setOpen(false);
			return;
		}
		isMeasuring.current = true;
		measureOrigin(indexRef.current, (origin) => {
			isMeasuring.current = false;
			setLayer({ origin });
		});
	}, [count, isOpen, layer, measureOrigin, setOpen]);

	const handleExited = useCallback(() => {
		setLayer(null);
		const image = imagesRef.current[indexRef.current];
		const target = image ? targets.current.get(image.id) : undefined;
		target?.focus();
	}, []);

	const open = useCallback(
		(at?: number) => {
			const total = imagesRef.current.length;
			if (isDisabled) return;
			if (total === 0) {
				if (process.env.NODE_ENV !== "production") {
					console.warn("ImageViewer: open() with no images. Mount a Trigger or pass `images` first.");
				}
				return;
			}
			if (at !== undefined) {
				const next = resolveViewerIndex(at, total);
				if (next !== indexRef.current) setSelected(next);
				indexRef.current = next;
			}
			setOpen(true);
		},
		[isDisabled, setOpen, setSelected]
	);

	const close = useCallback(() => setOpen(false), [setOpen]);

	const scrollTo = useCallback(
		(at: number) => {
			const next = resolveViewerIndex(at, imagesRef.current.length);
			if (next !== indexRef.current) setSelected(next);
		},
		[setSelected]
	);

	const openById = useCallback(
		(id: string) => {
			const at = imagesRef.current.findIndex((image) => image.id === id);
			if (at !== -1) open(at);
		},
		[open]
	);

	const context = useMemo<ImageViewerContextValue>(
		() => ({ close, count, images, index, isOpen, open, scrollTo }),
		[close, count, images, index, isOpen, open, scrollTo]
	);

	const internal = useMemo<ImageViewerInternalValue>(
		() => ({
			images,
			isDataMode: imagesProp !== undefined,
			isDisabled,
			openById,
			register,
			registerTarget,
			renderImage,
			unregister,
		}),
		[images, imagesProp, isDisabled, openById, register, registerTarget, renderImage, unregister]
	);

	return (
		<ImageViewerInternalProvider value={internal}>
			<ImageViewerProvider value={context}>
				{children}
				{layer ? (
					<ImageViewerLayer
						cornerRadius={cornerRadius}
						doubleTapScale={doubleTapScale}
						images={images}
						index={index}
						isDismissible={isDismissible}
						isOpen={isOpen}
						maxScale={maxScale}
						measureOrigin={measureOrigin}
						onClose={close}
						onExited={handleExited}
						onIndexChange={scrollTo}
						origin={layer.origin}
						renderImage={renderImage}
						showsChrome={showsChrome}
					/>
				) : null}
			</ImageViewerProvider>
		</ImageViewerInternalProvider>
	);
}

/**
 * A full-screen image viewer that opens out of a thumbnail: pinch, pan and
 * double-tap zoom, swipe between images, drag up or down to dismiss.
 *
 * The image grows out of the thumbnail's own frame and returns into it, so the
 * user keeps their place. A thumbnail scrolled out of view by then gets a fade
 * instead, and so does everything under reduce motion.
 *
 * **Composed mode** — the default — makes the gallery out of the mounted
 * `ImageViewer.Trigger`s, in mount order. **Data mode** takes `images` and
 * Triggers that name an `index`, for a virtualised list whose Triggers come and go.
 *
 * Open state and index each work either way: `open`/`onOpenChange` and
 * `index`/`onIndexChange` to control them, or `defaultOpen`/`defaultIndex`.
 *
 * The viewer itself is a React Native `Modal`, so it sits above navigators, tab
 * bars and sheets, and Android back closes it. It draws React Native's `Image`;
 * `renderImage` swaps in anything else.
 *
 * @example
 * <ImageViewer>
 *   {photos.map((photo) => (
 *     <ImageViewer.Trigger key={photo.id} {...photo} className="size-28 rounded-md" />
 *   ))}
 * </ImageViewer>
 *
 * @example
 * <ImageViewer images={photos} index={index} onIndexChange={setIndex}>
 *   <FlatList
 *     data={photos}
 *     renderItem={({ index }) => <ImageViewer.Trigger index={index} className="aspect-square" />}
 *   />
 * </ImageViewer>
 */
export const ImageViewer = Object.assign(ImageViewerRoot, {
	/** A thumbnail that opens the viewer at its image — and the frame the image flies from and back to. */
	Trigger: ImageViewerTrigger,
	/** A close button. The chrome draws one; this is for a second way out. */
	Close: ImageViewerClose,
	displayName: "DelacourUI.ImageViewer",
});
