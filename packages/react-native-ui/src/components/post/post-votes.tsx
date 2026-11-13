import { type ReactElement, useEffect, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { useAnnounce } from "../../hooks/use-announce";
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
	resolveVoteAnnouncement,
	resolveVoteKey,
	resolveVoteTone,
} from "./post.variants";
import { PostStatCount } from "./post-stat-count";

/** How long after a press a changed vote or score still counts as its result. */
const VOTE_ANNOUNCE_WINDOW_MS = 3000;

export type PostVotesProps = Omit<ViewProps, "children" | "style"> & {
	/** The score. A number is printed compactly and spoken in full. */
	score: number | string;
	/** The caller's vote. @default null */
	vote?: PostVote;
	/** Reports the vote a press casts. Pressing the arrow already cast reports `null`. */
	onVote?: (next: PostVote) => void;
	isDisabled?: boolean;
	/**
	 * Speaks the new state and score after the user's own vote lands, once per platform. A score
	 * that changes without a press (a server refresh) is never spoken. @default true
	 */
	announce?: boolean;
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
 * score. Focus stays on the arrow, whose label carries no score, so after the
 * user's own press the new state and score are announced ("Upvoted, score
 * 1,241") through the shared announcer: iOS has no live regions, and on Android
 * a live region beside the announcement would speak twice. A score that moves
 * with no press — a server refresh — is deliberately silent.
 */
export function PostVotes({
	score,
	vote = null,
	onVote,
	isDisabled = false,
	announce = true,
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
	const speak = useAnnounce();
	const pressedAt = useRef<number | null>(null);
	const first = useRef(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only a changed vote or score speaks; speak and announce are read as rendered
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		const at = pressedAt.current;
		if (at === null) return;
		pressedAt.current = null;
		if (Date.now() - at > VOTE_ANNOUNCE_WINDOW_MS) return;
		speak(resolveVoteAnnouncement(vote, score), { enabled: announce });
	}, [vote, score]);

	const cast = (pressed: "up" | "down"): void => {
		pressedAt.current = Date.now();
		onVote?.(resolveNextVote(vote, pressed));
	};

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
				onPress={() => cast("up")}
				testID={testID ? `${testID}-up` : "post-vote-up"}
			>
				<Icon className={slots.voteIcon()} color={vote === "up" ? tone : "muted-foreground"} icon={IconArrowUp} />
			</Pressable>
			<View accessibilityLabel={label} accessible>
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
				onPress={() => cast("down")}
				testID={testID ? `${testID}-down` : "post-vote-down"}
			>
				<Icon className={slots.voteIcon()} color={vote === "down" ? tone : "muted-foreground"} icon={IconArrowDown} />
			</Pressable>
		</View>
	);
}
PostVotes.displayName = "DelacourUI.Post.Votes";
