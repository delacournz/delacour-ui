import { IconBubble2, IconHeart, IconRepeat } from "@delacour/react-native-ui/icons/central";
import { Post } from "@delacour/react-native-ui/post";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Compact timeline",
	caption:
		"`compact` is a timeline row: the handle and time sit on the name's line, the face is small, and there is no picture.",
	align: "stretch",
	capture: { align: "stretch" },
};

type Row = { name: string; handle: string; avatar: number; minutes: number; body: string; likes: number };

const ROWS: readonly Row[] = [
	{ name: "Grace Hopper", handle: "@grace", avatar: 32, minutes: 3, body: "Found the bug. It was a moth.", likes: 412 },
	{
		name: "Alan Turing",
		handle: "@alan",
		avatar: 12,
		minutes: 58,
		body: "@grace keep it in the logbook #debugging",
		likes: 96,
	},
	{ name: "Ada Lovelace", handle: "@ada", avatar: 47, minutes: 240, body: "The engine weaves patterns.", likes: 1_820 },
];

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ROWS.map((row) => (
				<Post key={row.handle} variant="compact">
					<Post.Header>
						<Post.Author
							avatar={{ uri: `https://i.pravatar.cc/64?img=${row.avatar}` }}
							date={new Date(Date.now() - row.minutes * 60_000)}
							handle={row.handle}
							name={row.name}
						/>
					</Post.Header>
					<Post.Body>{row.body}</Post.Body>
					<Post.Footer>
						<Post.Stat icon={IconBubble2} label="Reply" />
						<Post.Stat icon={IconRepeat} label="Repost" />
						<Post.Stat icon={IconHeart} label="Like" tone="like" value={row.likes} />
					</Post.Footer>
				</Post>
			))}
		</View>
	);
}
