import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { IconPaperPlane } from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { SelectionMode } from "@delacour/react-native-ui/selection-mode";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a sheet",
	caption:
		"A composition rather than a part: the selection wraps the sheet, so its context reaches through the portal, and the bar sits in the sheet's own sticky footer instead of over the page.",
	note: "The bar is made `relative` and transparent there, and leaves the inset to the footer, which already clears the home indicator.",
	capture: { flow: "selection-mode/in-a-sheet", frame: "device" },
};

const SNAP_POINTS = ["60%"] as const;

const CHANNELS = [
	{ id: "general", title: "#general" },
	{ id: "design", title: "#design" },
	{ id: "releases", title: "#releases" },
	{ id: "random", title: "#random" },
	{ id: "support", title: "#support" },
] as const;

/** Each action receives the selection as it stands at the press. */
const noop = (_selected: string[]): void => undefined;

export function Demo(): ReactElement {
	return (
		<View className="flex-1 items-center justify-center">
			<SelectionMode className="flex-none" isActive values={CHANNELS.map((channel) => channel.id)}>
				<BottomSheet dynamicSizing={false} snapPoints={SNAP_POINTS}>
					<BottomSheet.Trigger asChild>
						<Button testID="open-sheet" variant="secondary">
							Post to channels
						</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Overlay />
						<BottomSheet.Container>
							<BottomSheet.ScrollView>
								<BottomSheet.Title>Post to</BottomSheet.Title>
								<SelectionMode.Group>
									{CHANNELS.map((channel) => (
										<SelectionMode.Item
											isIndicatorAlwaysShown
											key={channel.id}
											testID={`channel-${channel.id}`}
											value={channel.id}
										>
											<Item>
												<Item.Content>
													<Item.Title>{channel.title}</Item.Title>
												</Item.Content>
											</Item>
										</SelectionMode.Item>
									))}
								</SelectionMode.Group>
							</BottomSheet.ScrollView>
							<BottomSheet.Footer sticky>
								<SelectionMode.Bar
									className="relative border-t-0 bg-transparent"
									isSafeAreaAware={false}
									isShownWhenEmpty
								>
									<SelectionMode.Action icon={IconPaperPlane} onPress={noop}>
										Post
									</SelectionMode.Action>
								</SelectionMode.Bar>
							</BottomSheet.Footer>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</SelectionMode>
		</View>
	);
}
