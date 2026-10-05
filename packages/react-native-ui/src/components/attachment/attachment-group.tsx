import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { ScrollView, type ScrollViewProps } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { cn } from "../../lib/cn";
import {
	type AttachmentGroupContextValue,
	AttachmentGroupItemProvider,
	AttachmentGroupProvider,
} from "./attachment.context";
import {
	ATTACHMENT_GROUP_FADE_MS,
	type AttachmentGroupGap,
	type AttachmentLayout,
	type AttachmentSize,
	attachmentVariants,
} from "./attachment.variants";

export type AttachmentGroupProps = Omit<ScrollViewProps, "horizontal" | "children"> & {
	/** Size for every attachment in the group. A child's own `size` still wins. */
	size?: AttachmentSize;
	/** Layout for every attachment in the group. A child's own `layout` still wins. Default `chip`. */
	layout?: AttachmentLayout;
	/** Space between attachments. Default `sm`. */
	gap?: AttachmentGroupGap;
	/** What a screen reader calls the list. Default `Attachments`. */
	accessibilityLabel?: string;
	className?: string;
	/** Classes for the scrolled row — the place for edge padding that lines the tray up with a gutter. */
	contentContainerClassName?: string;
	children: ReactNode;
};

const GROUP_ITEM_LAYOUT = LinearTransition.duration(ATTACHMENT_GROUP_FADE_MS);
const GROUP_ITEM_ENTERING = FadeIn.duration(ATTACHMENT_GROUP_FADE_MS);
const GROUP_ITEM_EXITING = FadeOut.duration(ATTACHMENT_GROUP_FADE_MS);

/**
 * A horizontal tray of attachments — the row above a composer.
 *
 * Each child is wrapped in an animated cell: it fades in when added, fades out
 * when removed, and the rest slide along to close the gap. Under calm motion
 * the cells take no layout animation and appear and vanish at once.
 *
 * The row is announced as a list, and each attachment adds "2 of 5" as its
 * hint, so a screen-reader user knows where they are in it.
 *
 * Children need stable `key`s — the file's id, not its index — or removing the
 * first attachment re-uses its cell for the second and the slide reads backwards.
 */
export function AttachmentGroup({
	size,
	layout,
	gap = "sm",
	accessibilityLabel = "Attachments",
	className,
	contentContainerClassName,
	showsHorizontalScrollIndicator = false,
	children,
	...props
}: AttachmentGroupProps): ReactElement {
	const isCalm = useCalmMotion();
	const context = useMemo<AttachmentGroupContextValue>(() => ({ layout, size }), [layout, size]);
	const items = Children.toArray(children).filter(isValidElement);

	return (
		<AttachmentGroupProvider value={context}>
			<ScrollView
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="list"
				className={cn("grow-0", className)}
				contentContainerClassName={attachmentVariants({ gap }).group({ className: contentContainerClassName })}
				horizontal
				showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
				{...props}
			>
				{items.map((child, index) => (
					<Animated.View
						entering={isCalm ? undefined : GROUP_ITEM_ENTERING}
						exiting={isCalm ? undefined : GROUP_ITEM_EXITING}
						key={child.key ?? index}
						layout={isCalm ? undefined : GROUP_ITEM_LAYOUT}
					>
						<AttachmentGroupItemProvider value={{ count: items.length, index }}>{child}</AttachmentGroupItemProvider>
					</Animated.View>
				))}
			</ScrollView>
		</AttachmentGroupProvider>
	);
}
AttachmentGroup.displayName = "DelacourUI.Attachment.Group";
