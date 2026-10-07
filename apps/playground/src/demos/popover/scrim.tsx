import { Button } from "@delacour/react-native-ui/button";
import { Popover } from "@delacour/react-native-ui/popover";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrim",
	caption: "`hasScrim` dims the app behind the panel. Without it an outside tap still closes the popover.",
	capture: { flow: "popover/scrim", frame: "device" },
};

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<Popover>
				<Popover.Trigger asChild>
					<Button testID="open-popover" variant="secondary">
						Share
					</Button>
				</Popover.Trigger>
				<Popover.Content hasScrim>
					<Popover.Arrow />
					<Popover.Title>Share this page</Popover.Title>
					<Popover.Description>Anyone with the link can view it.</Popover.Description>
					<View className="flex-row gap-2">
						<Popover.Close asChild>
							<Button size="sm" testID="copy-link" variant="secondary">
								Copy link
							</Button>
						</Popover.Close>
					</View>
				</Popover.Content>
			</Popover>
		</View>
	);
}
