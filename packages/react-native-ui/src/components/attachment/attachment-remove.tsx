import type { ReactElement } from "react";
import { IconCrossSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useAttachmentPart } from "./attachment.context";
import { ATTACHMENT_ACTION_FOREGROUND_TOKEN, ATTACHMENT_ACTION_HIT_SLOP, attachmentVariants } from "./attachment.variants";

export type AttachmentRemoveProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled"> & {
	/** Defaults to the root's `onRemove`. */
	onPress?: () => void;
};

/**
 * The remove control — a cross that takes the attachment back out, or cancels
 * its upload.
 *
 * Always visible: there is no hover on a phone to reveal it. The glyph is 24
 * points and its slop grows the target to 44.
 *
 * It sits beside the root's press target rather than inside it, so its tap can
 * never also open the attachment. It is hidden from assistive technology, and
 * the root offers `remove` as an accessibility action instead — iOS folds a
 * button inside an accessible element into it, where it could not be reached.
 */
export function AttachmentRemove({
	className,
	onPress,
	feedback = "fade",
	hitSlop = ATTACHMENT_ACTION_HIT_SLOP,
	...props
}: AttachmentRemoveProps): ReactElement {
	const { isDisabled, layout, onRemove, removeLabel, size } = useAttachmentPart("Attachment.Remove");

	return (
		<Pressable
			accessibilityElementsHidden
			accessibilityLabel={removeLabel}
			accessible={false}
			className={attachmentVariants({ layout, size }).action({ className })}
			disabled={isDisabled}
			feedback={feedback}
			hitSlop={hitSlop}
			importantForAccessibility="no-hide-descendants"
			onPress={onPress ?? onRemove}
			{...props}
		>
			<Icon className="size-icon-sm" color={ATTACHMENT_ACTION_FOREGROUND_TOKEN[layout]} icon={IconCrossSmall} />
		</Pressable>
	);
}
AttachmentRemove.displayName = "DelacourUI.Attachment.Remove";
