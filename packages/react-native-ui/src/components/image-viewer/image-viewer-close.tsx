import type { ReactElement, ReactNode } from "react";
import { IconCrossMedium } from "../../icons/central";
import { Button, type ButtonProps } from "../button";
import { Icon } from "../icon";
import { useImageViewerPart } from "./image-viewer.context";

export type ImageViewerCloseProps = Omit<ButtonProps, "onPress" | "children"> & {
	/** Replaces the cross. */
	children?: ReactNode;
};

/**
 * Closes the viewer: a ghost icon `Button` with a cross in `media-foreground`,
 * labelled "Close image viewer". The chrome draws one; render another wherever a
 * second way out helps — it works anywhere inside `<ImageViewer>`.
 */
export function ImageViewerClose({
	children,
	accessibilityLabel = "Close image viewer",
	testID = "image-viewer-close",
	...props
}: ImageViewerCloseProps): ReactElement {
	const { close } = useImageViewerPart("ImageViewer.Close");

	const buttonProps: ButtonProps = {
		accessibilityLabel,
		size: "icon-md",
		testID,
		variant: "ghost",
		...props,
		onPress: close,
	};

	return <Button {...buttonProps}>{children ?? <Icon color="media-foreground" icon={IconCrossMedium} />}</Button>;
}
ImageViewerClose.displayName = "DelacourUI.ImageViewer.Close";
