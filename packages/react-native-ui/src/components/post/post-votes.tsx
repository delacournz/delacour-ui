import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { IconArrowDown, IconArrowUp } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable } from "../pressable";
import { usePostPart } from "./post.context";
import { formatCompactCount, resolveVotesLabel } from "./post.utils";
import {
	POST_HIT_SLOP,
	type PostVote,
	postVariants,
	resolveNextVote,
	resolveVoteKey,
	resolveVoteTone,
} from "./post.variants";
import { PostStatCount } from "./post-stat-count";

export type PostVotesProps = Omit<ViewProps, "children" | "style"> & {
	/** The score. A number is printed compactly and spoken in full. */
	score: number | string;
	/** The caller's vote. @default null */
	vote?: PostVote;
	/** Reports the vote a press casts. Pressing the arrow already cast reports `null`. */
	onVote?: (next: PostVote) => void;
	isDisabled?: boolean;
	className?: string;
};

/**
 * A score pill between an up and a down arrow, for a ranked community feed.
 *
 * The vote is the caller's: a press reports the *next* vote through `onVote`
 * — `resolveNextVote`, so pressing the cast arrow clears it — and the pill
 * shows whatever comes back. The whole pill tints with the cast direction,
 * because an arrow alone is too small a change to notice.
 *
 * Two buttons, "Upvote" and "Downvote", each `selected` when cast, either
 * side of a score read as "Score 1,240" — the full number, not `1.2K`. React
 * Native has no group role that VoiceOver reads, so the label sits on the
 * score, which is also a polite live region: a change is announced once.
 */
export function PostVotes({
	score,
	vote = null,
	onVote,
	isDisabled = false,
	accessibilityLabel,
	className,
	testID,
	...props
}: PostVotesProps): ReactElement {
	const { size } = usePostPart("Post.Votes");
	const slots = postVariants({ size, vote: resolveVoteKey(vote), isDisabled });
	const tone = resolveVoteTone(vote);
	const text = typeof score === "number" ? formatCompactCount(score) : score;
	const label = accessibilityLabel ?? resolveVotesLabel(score);

	return (
		<View className={slots.votes({ className })} testID={testID} {...props}>
			<Pressable
				accessibilityLabel="Upvote"
				accessibilityState={{ selected: vote === "up" }}
				className={slots.voteArrow()}
				disabled={isDisabled}
				feedback="scale-fade"
				haptic="selection"
				hitSlop={POST_HIT_SLOP}
				onPress={() => onVote?.(resolveNextVote(vote, "up"))}
				testID={testID ? `${testID}-up` : "post-vote-up"}
			>
				<Icon className={slots.voteIcon()} color={vote === "up" ? tone : "muted-foreground"} icon={IconArrowUp} />
			</Pressable>
			<View accessibilityLabel={label} accessibilityLiveRegion="polite" accessible>
				<PostStatCount className={slots.voteScore()} containerClassName={slots.statCount()} text={text} value={score} />
			</View>
			<Pressable
				accessibilityLabel="Downvote"
				accessibilityState={{ selected: vote === "down" }}
				className={slots.voteArrow()}
				disabled={isDisabled}
				feedback="scale-fade"
				haptic="selection"
				hitSlop={POST_HIT_SLOP}
				onPress={() => onVote?.(resolveNextVote(vote, "down"))}
				testID={testID ? `${testID}-down` : "post-vote-down"}
			>
				<Icon className={slots.voteIcon()} color={vote === "down" ? tone : "muted-foreground"} icon={IconArrowDown} />
			</Pressable>
		</View>
	);
}
PostVotes.displayName = "DelacourUI.Post.Votes";
