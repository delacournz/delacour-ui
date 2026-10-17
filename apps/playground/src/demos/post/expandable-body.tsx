import { Post } from "@delacour/react-native-ui/post";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Expandable body",
	caption:
		"`expandable` with `numberOfLines` clamps the body and offers more only when it actually overflows, then less once it is open.",
	align: "stretch",
	capture: { align: "stretch", flow: "post/expandable-body" },
};

const BODY =
	"Spent the weekend restoring a mechanical calculator. Every carry is a lever, every lever a spring, and every spring had rusted to the shape of the last sum it did in 1962. Forty hours later it adds again — slowly, loudly, and correctly. The trick was soaking the carriage overnight and resisting the urge to force anything.";

export function Demo(): ReactElement {
	return (
		<View className="min-h-80">
			<Post>
				<Post.Header>
					<Post.Author
						avatar={{ uri: "https://i.pravatar.cc/96?img=53" }}
						handle="@felix"
						name="Felix Arden"
						timestamp="3d"
					/>
				</Post.Header>
				<Post.Body expandable numberOfLines={3} testID="post-body">
					{BODY}
				</Post.Body>
			</Post>
		</View>
	);
}
