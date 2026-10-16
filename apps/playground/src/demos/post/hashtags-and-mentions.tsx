import { Post } from "@delacour/react-native-ui/post";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Hashtags and mentions",
	caption:
		"A string body is split into text, `#tags`, `@mentions` and links. Each is coloured; with a handler it is pressable and announced as a link, and the handler receives it without its `#` or `@`.",
	align: "stretch",
};

export function Demo(): ReactElement {
	const [pressed, setPressed] = useState("Tap a tag, a mention or the link");

	return (
		<View className="gap-3">
			<Post>
				<Post.Header>
					<Post.Author handle="@lena" name="Lena Varga" timestamp="1h" />
				</Post.Header>
				<Post.Body
					onLinkPress={(url) => setPressed(`Link ${url}`)}
					onMentionPress={(handle) => setPressed(`Mention ${handle}`)}
					onTagPress={(tag) => setPressed(`Tag ${tag}`)}
				>
					Compilers are for people, not machines. Thanks @aria for the notes — write-up at https://example.com/cobol.
					#COBOL #café
				</Post.Body>
			</Post>
			<Text.Caption align="center" color="muted">
				{pressed}
			</Text.Caption>
		</View>
	);
}
