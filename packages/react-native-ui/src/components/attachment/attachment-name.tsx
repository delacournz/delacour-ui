import type { ReactElement } from "react";
import { Text, type TextProps } from "../text";
import { useAttachmentPart } from "./attachment.context";
import { truncateMiddle } from "./attachment.utils";
import { attachmentVariants } from "./attachment.variants";

export type AttachmentNameProps = Omit<TextProps, "children"> & {
	/** Replaces the attachment's `name` on screen. The spoken label keeps the real one. */
	children?: string;
	/**
	 * Cuts the name to this many characters, keeping its extension. Without it
	 * the platform cuts by measured width, which is usually what you want.
	 */
	maxLength?: number;
};

/**
 * The file's name on one line, cut in the middle so the extension stays
 * visible — `report-q3-fin…ial.pdf`, never `report-q3-financ…`.
 *
 * The cut is the platform's own `ellipsizeMode="middle"`, which measures the
 * width it actually has. `maxLength` cuts by characters instead, through
 * `truncateMiddle`, for a column narrow enough that a width-based cut would
 * leave nothing but the ellipsis.
 */
export function AttachmentName({ className, children, maxLength, ...props }: AttachmentNameProps): ReactElement {
	const { layout, name, size, status } = useAttachmentPart("Attachment.Name");
	const text = children ?? name;

	return (
		<Text
			className={attachmentVariants({ layout, size, status: status.type }).name({ className })}
			ellipsizeMode="middle"
			numberOfLines={1}
			{...props}
		>
			{maxLength === undefined ? text : truncateMiddle(text, maxLength)}
		</Text>
	);
}
AttachmentName.displayName = "DelacourUI.Attachment.Name";
