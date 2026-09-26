import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconWallet1 } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Detached",
	caption:
		"`detached` floats the sheet as a card: a margin on each side, a gap above the home indicator, and every corner rounded. A tap in the margins or in the gap under the card closes it, and a drag down carries the whole card off-screen as one body — nothing clips at the resting line.",
	capture: { flow: "bottom-sheet/sizing/detached", frame: "device" },
};

/**
 * A floating card rather than a panel pinned to the bottom edge.
 *
 * The root fills and centres because this demo is captured as a whole screen:
 * a trigger left at the top would sit under the Dynamic Island.
 */
export function Demo(): ReactElement {
	const [isOpen, setOpen] = useState(false);

	return (
		<View className="flex-1 items-center justify-center">
			<BottomSheet detached isOpen={isOpen} onOpenChange={setOpen}>
				<BottomSheet.Trigger asChild>
					<Button testID="detached-open" variant="secondary">
						Open a floating card
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container testID="detached-panel">
						<BottomSheet.Content className="items-center pb-6 pt-2">
							<View className="mb-2 size-16 items-center justify-center rounded-full bg-muted">
								<Icon color="foreground" icon={IconWallet1} size={32} />
							</View>
							<BottomSheet.Title className="pr-0 text-center">Oh! Your wallet is empty</BottomSheet.Title>
							<BottomSheet.Description className="text-center">
								Add funds to keep sending. It takes under a minute and nothing here is lost.
							</BottomSheet.Description>
							<Button className="mt-2 self-stretch" onPress={() => setOpen(false)} testID="detached-add-funds">
								Add funds
							</Button>
							<View className="flex-row items-center justify-between self-stretch pt-1">
								<Text.Caption color="muted">No fees under $50</Text.Caption>
								<Text.Caption color="muted">Settings › Wallet</Text.Caption>
							</View>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
