import { type ReactElement, type ReactNode, useMemo } from "react";
import { View } from "react-native";
import { Pressable, type PressableProps } from "../pressable";
import { type PostContextValue, PostProvider } from "./post.context";
import { type PostSize, type PostVariant, postVariants } from "./post.variants";
import { PostAction } from "./post-action";
import { PostAuthor } from "./post-author";
import { PostBody } from "./post-body";
import { PostCommunity } from "./post-community";
import { PostFooter } from "./post-footer";
import { PostHeader } from "./post-header";
import { PostMedia } from "./post-media";
import { PostStat } from "./post-stat";
import { PostTitle } from "./post-title";
import { PostVotes } from "./post-votes";

export type PostProps = Omit<PressableProps, "asChild" | "children"> & {
	/** The card's shape — `feed`, `vote`, `compact` or `media`. @default "feed" */
	variant?: PostVariant;
	/** Type and gap density. @default "default" */
	size?: PostSize;
	/** Opens the post itself. Inner parts keep their own presses. Omit it and the card is a plain view. */
	onPress?: PressableProps["onPress"];
	children?: ReactNode;
	className?: string;
};

function PostRoot({
	variant = "feed",
	size = "default",
	onPress,
	onLongPress,
	disabled = false,
	className,
	children,
	...props
}: PostProps): ReactElement {
	const context = useMemo<PostContextValue>(() => ({ variant, size }), [variant, size]);
	const rootClass = postVariants({ variant, size, isDisabled: disabled }).root({ className });

	// `accessible={false}` on a pressable card is deliberate: an accessible
	// parent swallows its children on iOS, and the like and reply buttons inside
	// would vanish from VoiceOver. See AGENTS.md.
	const card =
		onPress || onLongPress ? (
			<Pressable
				accessibilityRole="button"
				className={rootClass}
				disabled={disabled}
				feedback="fade"
				onLongPress={onLongPress}
				onPress={onPress}
				{...props}
				accessible={false}
			>
				{children}
			</Pressable>
		) : (
			<View accessible={false} className={rootClass} {...props}>
				{children}
			</View>
		);

	return <PostProvider value={context}>{card}</PostProvider>;
}

/**
 * A social card — an author, a body, optional media and the counts underneath,
 * with the counts animated.
 *
 * Four shapes from one set of parts: `feed` (the full card), `vote` (a score
 * pill and a headline, for a ranked community), `compact` (a timeline row —
 * the handle inline, no picture) and `media` (the picture is the card, the
 * author laid over it under a scrim). The variant decides padding, the media's
 * frame and where the author sits — never which parts exist — so changing shape
 * is a prop change.
 *
 * Nothing is counted here. `active`, `value`, `vote` and `score` are the
 * caller's state; Post owns what a press looks like.
 *
 * @example
 * <Post onPress={openThread}>
 *   <Post.Header>
 *     <Post.Author avatar={{ uri }} date={postedAt} handle="@aria" name="Aria Whitlock" verified />
 *     <Post.Action accessibilityLabel="More" onPress={openMenu}>
 *       <Icon icon={IconDotGrid1x3Horizontal} />
 *     </Post.Action>
 *   </Post.Header>
 *   <Post.Body onTagPress={openTag}>Shipped the engine today #reactnative</Post.Body>
 *   <Post.Media alt="The analytical engine" source={{ uri: photo }} />
 *   <Post.Footer>
 *     <Post.Stat active={liked} icon={IconHeart} label="Like" onPress={toggleLike} tone="like" value={likes} />
 *     <Post.Stat icon={IconBubble2} label="Reply" value={replies} />
 *     <Post.Stat align="end" active={saved} icon={IconBookmark} label="Save" onPress={toggleSave} tone="save" />
 *   </Post.Footer>
 * </Post>
 *
 * @example
 * <Post variant="vote">
 *   <Post.Header>
 *     <Post.Community meta="5h ago · u/aria" name="r/reactnative" />
 *   </Post.Header>
 *   <Post.Title>Reanimated 4 is out</Post.Title>
 *   <Post.Body expandable numberOfLines={3}>{body}</Post.Body>
 *   <Post.Footer>
 *     <Post.Votes onVote={setVote} score={score} vote={vote} />
 *   </Post.Footer>
 * </Post>
 */
export const Post = Object.assign(PostRoot, {
	/** The row above the content — an author or a community, then actions. Laid over the picture in `media`. */
	Header: PostHeader,
	/** Who posted, and when — a face, a name, a handle and a relative time, read as one stop. */
	Author: PostAuthor,
	/** Where it was posted — the header a `vote` card leads with. */
	Community: PostCommunity,
	/** An icon button in the header — the ellipsis that opens the app's own menu. */
	Action: PostAction,
	/** The headline, announced as a header. */
	Title: PostTitle,
	/** The text, with tags, mentions and links picked out; optionally clamped with "more". */
	Body: PostBody,
	/** The picture, in a frame of fixed shape; `children` replace the image. */
	Media: PostMedia,
	/** The row of counts. */
	Footer: PostFooter,
	/** One count — a glyph that fills and a number that rolls. */
	Stat: PostStat,
	/** A score pill between an up and a down arrow. */
	Votes: PostVotes,
	displayName: "DelacourUI.Post",
});
