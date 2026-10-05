import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconBookmark,
	IconBubble2,
	IconDotGrid1x3Horizontal,
	IconEyeOpen,
	IconHeart,
} from "@delacour/react-native-ui/icons/central";
import { Post } from "@delacour/react-native-ui/post";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Feed card",
	caption:
		"The full card: an author with a verified check and a relative time, a body whose tag is picked out, a picture in a fixed 16:10 frame, and the counts underneath. Like and Save are caller state; the heart fills and its count rolls.",
	align: "stretch",
	capture: { align: "stretch", flow: "post/feed-card", hero: true },
};

const POSTED_AT = new Date(Date.now() - 1000 * 60 * 42);

export function Demo(): ReactElement {
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);

	return (
		<Post>
			<Post.Header>
				<Post.Author
					avatar={{ uri: "https://i.pravatar.cc/96?img=47" }}
					date={POSTED_AT}
					handle="@ada"
					name="Ada Lovelace"
					verified
				/>
				<Post.Action accessibilityLabel="More">
					<Icon icon={IconDotGrid1x3Horizontal} />
				</Post.Action>
			</Post.Header>
			<Post.Body>First light on the new engine — every gear cut by hand. #mechanics</Post.Body>
			<Post.Media alt="Brass gears on a workbench" source={{ uri: "https://picsum.photos/id/1067/800/500" }} />
			<Post.Footer>
				<Post.Stat icon={IconEyeOpen} label="Views" value={18_420} />
				<Post.Stat
					active={liked}
					icon={IconHeart}
					label="Like"
					onPress={() => setLiked((on) => !on)}
					testID="post-like"
					tone="like"
					value={liked ? 1_235 : 1_234}
				/>
				<Post.Stat icon={IconBubble2} label="Reply" value={86} />
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
