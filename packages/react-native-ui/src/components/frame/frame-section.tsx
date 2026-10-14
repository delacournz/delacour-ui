import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { listGroupVariants } from "../list-group/list-group.variants";
import { Text } from "../text";
import { useFramePart, useFrameTrayDivided } from "./frame.context";
import type { FrameSlotProps } from "./frame.types";
import { frameVariants, resolveFrameTraySize } from "./frame.variants";
import { withFrameDividers } from "./frame-dividers";

export type FrameSectionProps = FrameSlotProps & {
	/** The cluster's label, rendered as a muted caption above its rows. */
	title?: string;
};

/** Sections hold rows, never other sections, so nothing inside one takes a full-bleed rule. */
function isNeverSection(_node: ReactNode): boolean {
	return false;
}

/**
 * A labelled cluster of rows inside a `Frame.Tray` — "Email" under the push
 * rows, "Pending" above the invited members.
 *
 * The tray rules it off with full-bleed lines on either side, so a cluster reads
 * as a break in the card rather than as one more row; inside, its own rows are
 * divided the way the tray's are, following the tray's `isDivided`. The caption
 * starts at the rows' own inset, so it lines up with the text beneath it.
 *
 * With a title it is announced as a summary labelled by that title, so a screen
 * reader names the cluster once before reading its rows.
 */
export function FrameSection({ title, className, children, ...props }: FrameSectionProps): ReactElement {
	const { size } = useFramePart("Frame.Section");
	const isDivided = useFrameTrayDivided();
	const slots = frameVariants({ size });
	const divider = listGroupVariants({ size: resolveFrameTraySize(size) }).divider();
	const rows = isDivided ? withFrameDividers(children, divider, isNeverSection) : children;

	return (
		<View
			accessibilityLabel={title}
			accessibilityRole={title ? "summary" : undefined}
			className={slots.section({ className })}
			{...props}
		>
			{title ? <Text className={slots.sectionTitle()}>{title}</Text> : null}
			{rows}
		</View>
	);
}
FrameSection.displayName = "DelacourUI.Frame.Section";
