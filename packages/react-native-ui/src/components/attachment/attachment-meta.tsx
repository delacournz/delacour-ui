import type { ReactElement } from "react";
import { Text, type TextProps } from "../text";
import { useAttachmentPart } from "./attachment.context";
import { resolveAttachmentMeta } from "./attachment.utils";
import { attachmentVariants } from "./attachment.variants";

export type AttachmentMetaProps = Omit<TextProps, "children"> & {
	/** Replaces the composed line. */
	children?: string;
};

/**
 * The line under the name — `2.4 MB · PDF`, a recording's `1:05`, or, in error,
 * the app's message in the destructive colour.
 *
 * Renders nothing when there is nothing to say, so a name with no size sits
 * centred rather than above an empty line.
 */
export function AttachmentMeta({ className, children, ...props }: AttachmentMetaProps): ReactElement | null {
	const { durationMs, extension, kind, layout, size, sizeBytes, status } = useAttachmentPart("Attachment.Meta");
	const text = children ?? resolveAttachmentMeta({ durationMs, extension, kind, sizeBytes, status });
	if (!text) return null;

	return (
		<Text
			className={attachmentVariants({ layout, size, status: status.type }).meta({ className })}
			numberOfLines={1}
			{...props}
		>
			{text}
		</Text>
	);
}
AttachmentMeta.displayName = "DelacourUI.Attachment.Meta";
