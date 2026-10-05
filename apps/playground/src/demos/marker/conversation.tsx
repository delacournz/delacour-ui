import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckCircle2, IconFileText, IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { Marker } from "@delacour/react-native-ui/marker";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Between turns",
	caption: "Markers note what happened between two turns: no speaker, no bubble. A separator marker breaks the day.",
	capture: { align: "stretch", hero: true },
};

/** A turn in the conversation, drawn from `Surface` and `Text` alone. */
function Bubble({ from, children }: { from: "me" | "them"; children: string }): ReactElement {
	return (
		<Surface
			className={from === "me" ? "max-w-[80%] self-end rounded-2xl" : "max-w-[80%] self-start rounded-2xl"}
			padding="sm"
			variant={from === "me" ? "tertiary" : "default"}
		>
			<Text.Paragraph>{children}</Text.Paragraph>
		</Surface>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-1">
			<Marker variant="separator">Today</Marker>
			<Bubble from="me">Where is the theme toggle wired up?</Bubble>
			<Marker>
				<Marker.Icon>
					<Icon icon={IconMagnifyingGlass} />
				</Marker.Icon>
				<Marker.Content>Searched 128 files</Marker.Content>
			</Marker>
			<Marker>
				<Marker.Icon>
					<Icon icon={IconFileText} />
				</Marker.Icon>
				<Marker.Content>Read theme-toggle.tsx</Marker.Content>
			</Marker>
			<Bubble from="them">In the navbar of the index screen. It flips Uniwind's theme and nothing else.</Bubble>
			<Marker variant="border">
				<Marker.Icon>
					<Icon icon={IconCheckCircle2} />
				</Marker.Icon>
				<Marker.Content>Task complete</Marker.Content>
			</Marker>
		</View>
	);
}
