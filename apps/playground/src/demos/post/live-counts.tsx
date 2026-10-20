import { IconBookmark, IconHeart, IconRepeat } from "@delacour/react-native-ui/icons/central";
import { Post } from "@delacour/react-native-ui/post";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Live counts",
	caption:
		"Each toggle moves its count by one. The number rolls up from below when it rises and down from above when it falls; a lit glyph is the same outline, filled, with a one-shot pop. With Reduce Motion on, the number swaps instantly.",
	note: "Post counts nothing — `active` and `value` are this demo's state. An app reconciles its optimistic count with the server's.",
	align: "stretch",
	capture: { align: "stretch", flow: "post/live-counts" },
};

export function Demo(): ReactElement {
	const [liked, setLiked] = useState(false);
	const [reposted, setReposted] = useState(false);
	const [saved, setSaved] = useState(false);

	return (
		<Post>
			<Post.Header>
				<Post.Author
					avatar={{ uri: "https://i.pravatar.cc/96?img=13" }}
					handle="@rawiri"
					name="Rawiri Kemp"
					timestamp="2h"
				/>
			</Post.Header>
			<Post.Body>Can machines think? Asking for a friend.</Post.Body>
			<Post.Footer>
				<Post.Stat
					active={liked}
					icon={IconHeart}
					label="Like"
					onPress={() => setLiked((on) => !on)}
					testID="post-like"
					tone="like"
					value={liked ? 1_000 : 999}
				/>
				<Post.Stat
					active={reposted}
					icon={IconRepeat}
					label="Repost"
					onPress={() => setReposted((on) => !on)}
					testID="post-repost"
					tone="repost"
					value={reposted ? 43 : 42}
				/>
				<Post.Stat
					active={saved}
					align="end"
					icon={IconBookmark}
					label="Save"
					onPress={() => setSaved((on) => !on)}
					testID="post-save"
					tone="save"
				/>
			</Post.Footer>
		</Post>
	);
}
