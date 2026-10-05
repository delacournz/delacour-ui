import { Marquee } from "@delacour/react-native-ui/marquee";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Vertical",
	caption:
		"A column of notices travelling up. A vertical marquee needs a bounded height — here `h-48` — to clip against.",
	align: "stretch",
};

const NOTICES = [
	"Deploy finished in 42 seconds",
	"Three new comments on the design review",
	"Storage is 82% full",
	"Weekly report is ready",
	"Build 1.4.2 passed every check",
] as const;

export function Demo(): ReactElement {
	return (
		<Marquee
			className="h-48"
			direction="up"
			fade={{ kind: "edges", size: 32 }}
			contentClassName="gap-2"
			gap="sm"
			speed={24}
			testID="marquee-vertical"
		>
			{NOTICES.map((notice) => (
				<View className="rounded-lg bg-muted px-3 py-2" key={notice}>
					<Text>{notice}</Text>
				</View>
			))}
		</Marquee>
	);
}
