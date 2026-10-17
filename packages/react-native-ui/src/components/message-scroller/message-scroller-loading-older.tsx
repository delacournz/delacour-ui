import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Spinner } from "../spinner";
import { messageScrollerVariants } from "./message-scroller.variants";

export type MessageScrollerLoadingOlderProps = {
	/** What a screen reader hears. Default "Loading older messages". */
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
	label = "Loading older messages",
	className,
	testID,
}: MessageScrollerLoadingOlderProps): ReactElement {
	const slots = messageScrollerVariants();
	return (
		<View
			accessibilityLabel={label}
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
