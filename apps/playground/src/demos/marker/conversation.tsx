import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckCircle2, IconFileText, IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { Marker } from "@delacour/react-native-ui/marker";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Between turns",
	caption:
		"Markers note what happened between two turns: no speaker, no bubble. Tap a step to see what it covered; a separator marker breaks the day.",
	capture: { align: "stretch", flow: true, hero: true },
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

const SEARCHED = ["src/app/index.tsx", "src/components/theme-toggle.tsx", "global.css"] as const;

/** Holds the open step's height from the start, as `pressable` does, so the clip's crop never cuts it. */
export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<View className="min-h-[25rem] gap-1">
			<Marker variant="separator">Today</Marker>
			<Bubble from="me">Where is the theme toggle wired up?</Bubble>
			<Marker
				accessibilityHint={isOpen ? "Hides the matches" : "Shows the matches"}
				onPress={() => setIsOpen((open) => !open)}
				testID="conversation-search"
			>
				<Marker.Icon>
					<Icon icon={IconMagnifyingGlass} />
				</Marker.Icon>
				<Marker.Content>Searched 128 files</Marker.Content>
			</Marker>
			{isOpen ? (
				<View className="items-center gap-1 pb-1">
					{SEARCHED.map((file) => (
						<Text.Code className="text-muted-foreground text-xs" key={file}>
							{file}
						</Text.Code>
					))}
				</View>
			) : null}
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
