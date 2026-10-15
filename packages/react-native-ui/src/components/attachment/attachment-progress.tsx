import type { ReactElement } from "react";
import { View } from "react-native";
import { Progress, type ProgressColor } from "../progress";
import { useAttachmentPart } from "./attachment.context";
import { clampProgress } from "./attachment.utils";
import { attachmentVariants } from "./attachment.variants";

export type AttachmentProgressProps = {
	className?: string;
	/** What the fill is painted. Default `primary`. */
	color?: ProgressColor;
};

/**
 * The upload bar, drawn only while the status is `uploading`.
 *
 * A `Progress` underneath, so the fill slides on the UI thread and an
 * indeterminate upload loops — and keeps looping under reduce motion, because a
 * moving bar is what says the work is alive. On a chip it is a 2pt line along
 * the bottom edge; on a card it sits under the meta line; on a tile it is a
 * short bar centred on a dimming veil.
 *
 * Hidden from assistive technology: the root already speaks the upload, in
 * ten-percent steps, and a second element would read it again on every tick.
 */
export function AttachmentProgress({ className, color = "primary" }: AttachmentProgressProps): ReactElement | null {
	const { layout, size, status } = useAttachmentPart("Attachment.Progress");
	if (status.type !== "uploading") return null;

	const slots = attachmentVariants({ layout, size, status: status.type });
	const progress = clampProgress(status.progress);

	const bar = (
		<Progress
			accessibilityElementsHidden
			accessible={false}
			className={slots.progress({ className })}
			color={color}
			importantForAccessibility="no-hide-descendants"
			isIndeterminate={progress === undefined}
			pointerEvents="none"
			size="sm"
			value={(progress ?? 0) * 100}
		>
			<Progress.Track className={slots.progressTrack()}>
				<Progress.Fill />
			</Progress.Track>
		</Progress>
	);

	// A tile has no edge to run a line along, so the bar sits on a veil that
	// dims the picture until the upload lands.
	if (layout !== "tile") return bar;
	return (
		<View className={slots.dim()} pointerEvents="none">
			{bar}
		</View>
	);
}
AttachmentProgress.displayName = "DelacourUI.Attachment.Progress";
