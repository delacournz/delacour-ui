import type { ReactElement } from "react";
import type { AccessibilityActionEvent } from "react-native";
import { Pressable } from "../pressable";
import { resolvePostCardActions } from "./post.utils";

export type PostCardActionProps = {
	onPress?: () => void;
	onLongPress?: () => void;
};

/**
 * The screen-reader stop for a pressable card's own `onPress` and `onLongPress`.
 *
 * The card root is `accessible={false}` so its inner controls stay reachable, which leaves its
 * presses with no element. This is that element: a one-point, transparent `Pressable` pinned to the
 * card's corner and out of flow, so it moves no pixel and, with `pointerEvents="none"`, takes no
 * finger — a tap still lands on the card. It is not a `Text` (Fabric never makes a paragraph the
 * accessibility element, so its actions never fire) and not a merged body frame (an accessible
 * parent hides its children). `Pressable` routes activation per platform; `longpress` is added
 * here on every platform. Not `opacity: 0`: UIKit and TalkBack skip a fully transparent view.
 *
 * Internal: rendered by `Post`, first in the card, only for a pressable, enabled card.
 */
export function PostCardAction({ onPress, onLongPress }: PostCardActionProps): ReactElement {
	const actions = resolvePostCardActions({ hasLongPress: onLongPress !== undefined });
	const handleAction = (event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === "longpress") onLongPress?.();
	};

	return (
		<Pressable
			accessibilityActions={actions.length > 0 ? actions : undefined}
			accessibilityLabel="Open post"
			accessibilityRole="button"
			className="absolute top-0 left-0 h-px w-px"
			feedback="none"
			onAccessibilityAction={handleAction}
			onLongPress={onLongPress}
			onPress={onPress}
			pointerEvents="none"
			testID="post-card-action"
		/>
	);
}
PostCardAction.displayName = "DelacourUI.Post.CardAction";
