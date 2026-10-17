import { IconBubble2, IconHeart } from "@delacour/react-native-ui/icons/central";
import { POST_SIZES, Post, type PostSize } from "@delacour/react-native-ui/post";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "`sm` steps the type one preset down, the gaps one step, and the face from medium to small.",
	align: "stretch",
};

const LABELS: Record<PostSize, string> = { default: "Default size", sm: "Small size" };

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{POST_SIZES.map((size) => (
				<Post key={size} size={size}>
					<Post.Header>
						<Post.Author
							avatar={{ uri: "https://i.pravatar.cc/96?img=16" }}
							handle="@aria"
							name="Aria Whitlock"
							timestamp="5m"
						/>
					</Post.Header>
					<Post.Body>{LABELS[size]} — the same parts, denser.</Post.Body>
					<Post.Footer>
						<Post.Stat icon={IconHeart} label="Like" tone="like" value={128} />
						<Post.Stat icon={IconBubble2} label="Reply" value={12} />
					</Post.Footer>
				</Post>
			))}
		</View>
	);
}
