import type { ReactElement } from "react";
import { IconArrowRotateCounterClockwise } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useAttachmentPart } from "./attachment.context";
import { ATTACHMENT_ACTION_FOREGROUND_TOKEN, ATTACHMENT_ACTION_HIT_SLOP, attachmentVariants } from "./attachment.variants";

export type AttachmentRetryProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled"> & {
	/** Defaults to the root's `onRetry`. */
	onPress?: () => void;
};

/**
 * The retry control, drawn in error when the app gave an `onRetry`.
 *
 * It takes the place the progress bar held. Like `Attachment.Remove` it sits
 * beside the press target, never inside it, and is hidden from assistive
 * technology — the root offers `retry` as an accessibility action instead.
 */
export function AttachmentRetry({
	className,
	onPress,
	feedback = "fade",
	hitSlop = ATTACHMENT_ACTION_HIT_SLOP,
	...props
}: AttachmentRetryProps): ReactElement {
	const { isDisabled, layout, onRetry, size } = useAttachmentPart("Attachment.Retry");

	return (
		<Pressable
			accessibilityElementsHidden
			accessibilityLabel="Retry upload"
			accessible={false}
			className={attachmentVariants({ layout, size }).action({ className })}
			disabled={isDisabled}
			feedback={feedback}
			hitSlop={hitSlop}
			importantForAccessibility="no-hide-descendants"
			onPress={onPress ?? onRetry}
			{...props}
		>
			<Icon className="size-icon-sm" color={ATTACHMENT_ACTION_FOREGROUND_TOKEN[layout]} icon={IconArrowRotateCounterClockwise} />
		</Pressable>
	);
}
AttachmentRetry.displayName = "DelacourUI.Attachment.Retry";
