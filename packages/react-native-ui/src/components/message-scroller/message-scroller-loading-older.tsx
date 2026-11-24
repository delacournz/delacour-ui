import type { ReactElement } from "react";
import { View } from "react-native";
import { useLabels } from "../../hooks/use-labels";
import { cn } from "../../lib/cn";
import { Spinner } from "../spinner";
import { useMessageScroller } from "./message-scroller.context";
import { messageScrollerVariants } from "./message-scroller.variants";

export type MessageScrollerLoadingOlderProps = {
	/** What a screen reader hears. Default `labels.loadingOlder`, "Loading older messages". */
	label?: string;
	className?: string;
	testID?: string;
};

/**
 * The spinner row above the first message while an older page is in flight.
 *
 * It appears and leaves without a height animation: a tween here would run during the prepend and
 * fight the list's visible-content anchoring, nudging the reader's place by its own height.
 */
export function MessageScrollerLoadingOlder({
	label,
	className,
	testID,
}: MessageScrollerLoadingOlderProps): ReactElement {
	const slots = messageScrollerVariants();
	const own = useLabels("messageScroller");
	const labels = useMessageScroller()?.labels ?? own;
	return (
		<View
			accessibilityLabel={label ?? labels.loadingOlder}
			accessibilityRole="progressbar"
			accessible
			className={cn(slots.loadingOlder(), className)}
			testID={testID}
		>
			<Spinner color="muted-foreground" size="sm" />
		</View>
	);
}
MessageScrollerLoadingOlder.displayName = "DelacourUI.MessageScroller.LoadingOlder";
