import { type ReactElement, useState } from "react";
import { Image, type ImageProps, View, type ViewProps } from "react-native";
import { IconFileText, IconImages1, IconMicrophone, IconPlay, IconVideo } from "../../icons/central";
import { cn } from "../../lib/cn";
import { Icon, type IconComponent } from "../icon";
import { useAttachmentPart } from "./attachment.context";
import { resolveAttachmentSourceKey } from "./attachment.utils";
import { ATTACHMENT_KIND_TONE, type AttachmentKind, attachmentVariants } from "./attachment.variants";

/** The glyph each kind is drawn with when there is no picture, or until it loads. */
export const ATTACHMENT_KIND_ICON: Record<AttachmentKind, IconComponent> = {
	image: IconImages1,
	video: IconVideo,
	audio: IconMicrophone,
	file: IconFileText,
};

export type AttachmentPreviewProps = Omit<ViewProps, "children"> & {
	className?: string;
	/** Passed to the `Image`. `onError` still fires, after the glyph has taken over. */
	imageProps?: Omit<ImageProps, "source">;
};

/**
 * The thumbnail: the kind's glyph on its tint, with the picture over it.
 *
 * **The glyph is always painted and the image mounts on top**, so a slow or
 * dead URL leaves the type glyph rather than a hole. A failure is remembered by
 * source key, so an inline `source={{ uri }}` does not retry on every render
 * and a new URI does.
 *
 * A video with a poster frame wears a centred play disc once the poster has
 * drawn, so it does not read as a photo.
 */
export function AttachmentPreview({ className, imageProps, ...props }: AttachmentPreviewProps): ReactElement {
	const { kind, layout, size, source } = useAttachmentPart("Attachment.Preview");
	const slots = attachmentVariants({ kind, layout, size });

	const sourceKey = resolveAttachmentSourceKey(source);
	const [failedKey, setFailedKey] = useState<string | null>(null);
	const showsImage = source !== undefined && sourceKey !== null && sourceKey !== failedKey;

	return (
		<View className={slots.preview({ className })} {...props}>
			<View className={slots.previewFallback()}>
				<Icon
					className={slots.glyph()}
					color={ATTACHMENT_KIND_TONE[kind].foreground}
					icon={ATTACHMENT_KIND_ICON[kind]}
				/>
			</View>
			{showsImage ? (
				<Image
					accessibilityIgnoresInvertColors
					resizeMode="cover"
					{...imageProps}
					className={cn(slots.image(), imageProps?.className)}
					onError={(event) => {
						setFailedKey(sourceKey);
						imageProps?.onError?.(event);
					}}
					source={source}
				/>
			) : null}
			{showsImage && kind === "video" ? (
				<View className={slots.badge()}>
					<Icon className="size-icon-xs" color="foreground" icon={IconPlay} />
				</View>
			) : null}
		</View>
	);
}
AttachmentPreview.displayName = "DelacourUI.Attachment.Preview";
