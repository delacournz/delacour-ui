import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconChevronDownSmall,
	IconChevronRightSmall,
	IconMagnifyingGlass,
} from "@delacour/react-native-ui/icons/central";
import { Marker } from "@delacour/react-native-ui/marker";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pressable",
	caption:
		"Give a marker `onPress` and it becomes a button that fades on press. Here it expands the step it summarises.",
	capture: { align: "stretch", flow: "marker/pressable" },
};

const FILES = [
	"src/app/index.tsx",
	"src/components/theme-toggle.tsx",
	"src/design-system/store.ts",
	"global.css",
] as const;

/**
 * The demo holds the expanded height from the start, so opening the step grows into room
 * already on the page instead of pushing the marker up out of a published crop.
 */
export function Demo(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<View className="min-h-32 gap-1">
			<Marker
				accessibilityHint={isOpen ? "Hides the files" : "Shows the files"}
				onPress={() => setIsOpen((open) => !open)}
				testID="explored-files"
			>
				<Marker.Icon>
					<Icon icon={IconMagnifyingGlass} />
				</Marker.Icon>
				<Marker.Content>Explored {FILES.length} files</Marker.Content>
				<Marker.Icon>
					<Icon icon={isOpen ? IconChevronDownSmall : IconChevronRightSmall} />
				</Marker.Icon>
			</Marker>
			{isOpen ? (
				<View className="items-center gap-1">
					{FILES.map((file) => (
						<Text.Code className="text-muted-foreground text-xs" key={file}>
							{file}
						</Text.Code>
					))}
				</View>
			) : null}
		</View>
	);
}
