import { Post } from "@delacour/react-native-ui/post";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Media states",
	caption:
		"The frame's height is its aspect ratio, never the picture's. A dead URL shows an image glyph in the same frame, and a dead avatar falls back to initials — nothing shifts.",
	align: "stretch",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Post>
				<Post.Header>
					<Post.Author avatar={{ uri: "https://invalid.example/face.jpg" }} name="Tomasi Fifita" timestamp="1h" />
				</Post.Header>
				<Post.Media alt="A picture that failed to load" source={{ uri: "https://invalid.example/photo.jpg" }} />
			</Post>
			<Post>
				<Post.Header>
					<Post.Author avatar={{ uri: "https://i.pravatar.cc/96?img=45" }} name="Saskia Lund" timestamp="2h" />
				</Post.Header>
				<Post.Media
					alt="A tall photo of a forest"
					aspectRatio={16 / 10}
					source={{ uri: "https://picsum.photos/id/1018/600/1200" }}
				/>
			</Post>
		</View>
	);
}
