import { Post, type PostVote } from "@delacour/react-native-ui/post";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vote",
	caption:
		"A ranked-community card: a community header, a headline and a clamped body, with the score pill leading the footer. Tap an arrow to vote; tap it again to clear. The pill tints with the cast direction.",
	align: "stretch",
};

const BASE_SCORE = 1_240;

const OFFSET: Record<"up" | "down" | "none", number> = { up: 1, down: -1, none: 0 };

export function Demo(): ReactElement {
	const [vote, setVote] = useState<PostVote>(null);

	return (
		<Post variant="vote">
			<Post.Header>
				<Post.Community meta="5h ago · u/ada" name="r/reactnative" />
			</Post.Header>
			<Post.Title>Reanimated 4 layout animations on the new architecture</Post.Title>
			<Post.Body numberOfLines={3}>
				Moved a feed of forty cards over this week. Entering and exiting animations are cheaper than they were, the
				counts roll without a frame drop, and the only thing I had to rewrite was a ref read during render.
			</Post.Body>
			<Post.Footer>
				<Post.Votes onVote={setVote} score={BASE_SCORE + OFFSET[vote ?? "none"]} vote={vote} />
			</Post.Footer>
		</Post>
	);
}
