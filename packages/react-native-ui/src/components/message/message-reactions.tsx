import { Children, type ReactElement, type ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useMessagePart } from "./message.context";
import type { MessageReactionPlacement } from "./message.variants";
import { messageVariants } from "./message.variants";

const REACTION_ENTERING = ZoomIn.springify().damping(14);

export type MessageReactionsProps = {
	/** `overlap` hangs the row over the bubble's bottom edge; `below` gives it a line of its own. Default `overlap`. */
	placement?: MessageReactionPlacement;
	className?: string;
	/** Chips, badges, anything — keyed, so a newly added one can spring in. */
	children: ReactNode;
};

/**
 * A row of reactions under the bubble, aligned to the message's side.
 *
 * A reaction added after the row first mounts springs in; the ones already
 * there when it mounted do not, so scrolling history back into view stays
 * still. Under reduce motion nothing springs.
 */
export function MessageReactions({ placement = "overlap", className, children }: MessageReactionsProps): ReactElement {
	const { direction } = useMessagePart("Message.Reactions");
	const isCalm = useCalmMotion();
	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => setHasMounted(true), []);

	const entering = hasMounted && !isCalm ? REACTION_ENTERING : undefined;
	const alignClass = direction === "outgoing" ? "justify-end" : "justify-start";

	return (
		<View className={messageVariants({ placement }).reactions({ className: [alignClass, className] })}>
			{Children.map(children, (child) => (
				<Animated.View entering={entering}>{child}</Animated.View>
			))}
		</View>
	);
}
MessageReactions.displayName = "DelacourUI.Message.Reactions";
