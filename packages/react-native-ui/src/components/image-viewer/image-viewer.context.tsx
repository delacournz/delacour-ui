import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ImageViewerImage, ImageViewerRenderImage } from "./image-viewer.types";
import type { ViewerRect } from "./image-viewer.variants";

/** What `useImageViewer()` returns: whether it is open, where, and the ways to move it. */
export type ImageViewerContextValue = {
	isOpen: boolean;
	/** The image showing, clamped into the gallery. */
	index: number;
	count: number;
	/** The gallery: `images` in data mode, the mounted Triggers in mount order in composed mode. */
	images: readonly ImageViewerImage[];
	/** Opens at `index`, or at the current one. A no-op while disabled or with nothing to show. */
	open: (index?: number) => void;
	close: () => void;
	/** Moves to `index`, open or not. */
	scrollTo: (index: number) => void;
};

/** Where a Trigger sits on screen right now, and the corner it wears. */
export type ImageViewerOrigin = { rect: ViewerRect; radius: number };

/** What a mounted Trigger offers the viewer: its frame to fly from and to, and a way to take focus back. */
export type ImageViewerTarget = {
	measure: (callback: (origin: ImageViewerOrigin | null) => void) => void;
	focus: () => void;
};

/**
 * The plumbing a Trigger needs and nothing a caller should see. Every field is
 * stable for the viewer's lifetime except `isDisabled`, `renderImage` and
 * `images`, so a Trigger re-renders for those alone.
 */
export type ImageViewerInternalValue = {
	isDisabled: boolean;
	/** Data mode: Triggers refer to `images[index]` rather than registering. */
	isDataMode: boolean;
	images: readonly ImageViewerImage[];
	renderImage?: ImageViewerRenderImage;
	/** Composed mode: add or update this Trigger's image. `token` is the Trigger's own, so duplicates of one id coexist. */
	register: (token: string, image: ImageViewerImage) => void;
	unregister: (token: string) => void;
	/** Both modes: the frame to fly from for `id`. Returns the unregister. */
	registerTarget: (id: string, target: ImageViewerTarget) => () => void;
	openById: (id: string) => void;
};

const ImageViewerContext = createContext<ImageViewerContextValue | null>(null);
const ImageViewerInternalContext = createContext<ImageViewerInternalValue | null>(null);

/**
 * Supplies the open state and its actions.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./image-viewer` — which would close a cycle.
 */
export function ImageViewerProvider({
	value,
	children,
}: {
	value: ImageViewerContextValue;
	children: ReactNode;
}): ReactElement {
	return <ImageViewerContext value={value}>{children}</ImageViewerContext>;
}
ImageViewerProvider.displayName = "DelacourUI.ImageViewer.Provider";

/** Supplies the Trigger plumbing. */
export function ImageViewerInternalProvider({
	value,
	children,
}: {
	value: ImageViewerInternalValue;
	children: ReactNode;
}): ReactElement {
	return <ImageViewerInternalContext value={value}>{children}</ImageViewerInternalContext>;
}
ImageViewerInternalProvider.displayName = "DelacourUI.ImageViewer.InternalProvider";

/** The enclosing viewer's state and actions, or null outside an `<ImageViewer>`. */
export function useImageViewerContext(): ImageViewerContextValue | null {
	return use(ImageViewerContext);
}

/**
 * Reads the enclosing viewer: whether it is open, the gallery, and the ways to
 * open, close and move it. For a custom control — an "open gallery" button, a
 * counter. Throws outside an `<ImageViewer>`.
 */
export function useImageViewer(): ImageViewerContextValue {
	const context = useImageViewerContext();
	if (!context) {
		throw new Error("useImageViewer must be called inside an <ImageViewer>.");
	}
	return context;
}

/** The enclosing viewer, for a part that cannot work without one. Internal. */
export function useImageViewerPart(component: string): ImageViewerContextValue {
	const context = useImageViewerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside an <ImageViewer>.`);
	}
	return context;
}

/** The enclosing viewer's plumbing, for a part that cannot work without it. Internal. */
export function useImageViewerInternalPart(component: string): ImageViewerInternalValue {
	const context = use(ImageViewerInternalContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside an <ImageViewer>.`);
	}
	return context;
}
