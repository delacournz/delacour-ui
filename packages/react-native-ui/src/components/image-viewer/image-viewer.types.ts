import type { ReactElement } from "react";
import type { ImageSourcePropType, ImageStyle, StyleProp } from "react-native";

/** One image in the gallery. */
export type ImageViewerImage = {
	/** Stable key. The gallery is keyed by it, and a Trigger is found by it to fly home to. */
	id: string;
	/** What the thumbnail and the opening flight draw. Already decoded, so it is the viewer's base layer. */
	source: ImageSourcePropType;
	/** A sharper source loaded once the viewer is open. The thumbnail stays underneath until it arrives. */
	fullSource?: ImageSourcePropType;
	/** Required: read by screen readers on the Trigger and in the viewer. */
	alt: string;
	/** Drawn under the image while the chrome shows, and read with it. */
	caption?: string;
	/** Intrinsic size. Lets the opening frame be right before a remote image reports its own. */
	width?: number;
	height?: number;
};

/** What `renderImage` is handed: everything the viewer needs from an image component, and no more. */
export type ImageViewerRenderImageProps = {
	source: ImageSourcePropType;
	alt: string;
	resizeMode: "cover" | "contain";
	style: StyleProp<ImageStyle>;
	/** Call with the decoded image's intrinsic size. */
	onLoad: (size: { width: number; height: number }) => void;
	onError: () => void;
	testID?: string;
};

/** Draws one image. Default: React Native's `Image`. */
export type ImageViewerRenderImage = (props: ImageViewerRenderImageProps) => ReactElement;
