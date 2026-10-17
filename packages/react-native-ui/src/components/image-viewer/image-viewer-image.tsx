import type { ReactElement } from "react";
import { Image, type ImageLoadEventData, type NativeSyntheticEvent } from "react-native";
import type { ImageViewerRenderImage, ImageViewerRenderImageProps } from "./image-viewer.types";

export type ImageViewerImageViewProps = ImageViewerRenderImageProps & {
	/** The caller's escape hatch. Absent, React Native's `Image` draws it. */
	renderImage?: ImageViewerRenderImage;
};

/**
 * One drawn image: the caller's `renderImage` when given, otherwise React
 * Native's `Image`. Never itself an accessibility element — the Trigger and the
 * pager around it carry the `alt`, so a screen reader hears it once.
 */
export function ImageViewerImageView({ renderImage, ...props }: ImageViewerImageViewProps): ReactElement {
	if (renderImage) return renderImage(props);

	const { onError, onLoad, resizeMode, source, style, testID } = props;
	const handleLoad = (event: NativeSyntheticEvent<ImageLoadEventData>) => {
		const { height, width } = event.nativeEvent.source;
		onLoad({ height, width });
	};

	return (
		<Image
			accessibilityIgnoresInvertColors
			accessible={false}
			onError={onError}
			onLoad={handleLoad}
			resizeMode={resizeMode}
			source={source}
			style={style}
			testID={testID}
		/>
	);
}
ImageViewerImageView.displayName = "DelacourUI.ImageViewer.Image";
