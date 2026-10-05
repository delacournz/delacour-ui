import { Icon } from "@delacour/react-native-ui/icon";
import { IconDotGrid1x3Horizontal, IconHeart, IconShareOs } from "@delacour/react-native-ui/icons/central";
import { Post } from "@delacour/react-native-ui/post";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Media first",
	caption:
		"`media` makes the picture the card. The author is laid over it in white, and a static black scrim along the top keeps that type legible over a bright photo in either theme.",
	align: "stretch",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [liked, setLiked] = useState(true);

	return (
		<Post variant="media">
			<Post.Header>
				<Post.Author
					avatar={{ uri: "https://i.pravatar.cc/96?img=5" }}
					handle="@margaret"
					name="Margaret Hamilton"
					timestamp="Yesterday"
				/>
				<Post.Action accessibilityLabel="More">
					<Icon icon={IconDotGrid1x3Horizontal} />
				</Post.Action>
			</Post.Header>
			<Post.Media
				alt="Snow on a mountain ridge under a pale sky"
				aspectRatio={4 / 5}
				source={{ uri: "https://picsum.photos/id/1036/800/1000" }}
			/>
			<Post.Body>Above the cloud line by sunrise.</Post.Body>
			<Post.Footer>
				<Post.Stat
					active={liked}
					icon={IconHeart}
					label="Like"
					onPress={() => setLiked((on) => !on)}
					tone="like"
					value={liked ? 2_049 : 2_048}
				/>
				<Post.Stat align="end" icon={IconShareOs} label="Share" />
			</Post.Footer>
		</Post>
	);
}
