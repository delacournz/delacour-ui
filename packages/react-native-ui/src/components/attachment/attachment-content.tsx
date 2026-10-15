import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useAttachmentPart } from "./attachment.context";
import { attachmentVariants } from "./attachment.variants";
import { AttachmentMeta } from "./attachment-meta";
import { AttachmentName } from "./attachment-name";

export type AttachmentContentProps = ViewProps & {
	className?: string;
	/** Defaults to the name over the meta line. */
	children?: ReactNode;
};

/**
 * The text column — the name over its meta line.
 *
 * On a tile it becomes a frosted strip along the bottom edge, so the name reads
 * over any picture in either theme.
 */
export function AttachmentContent({ className, children, ...props }: AttachmentContentProps): ReactElement {
	const { layout, size } = useAttachmentPart("Attachment.Content");

	return (
		<View className={attachmentVariants({ layout, size }).content({ className })} {...props}>
			{children ?? (
				<>
					<AttachmentName />
					<AttachmentMeta />
				</>
			)}
		</View>
	);
}
AttachmentContent.displayName = "DelacourUI.Attachment.Content";
