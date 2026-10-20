import { GridItem } from "@delacour/react-native-ui/grid-item";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell, IconCamera1, IconLock, IconSun } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Pressable tiles",
	caption:
		"A tile with an `onPress` is a button: it scales gently, can fire a haptic, and announces itself as one stop. `isDisabled` dims it and stops the press.",
	capture: { align: "stretch", flow: true },
};

export function Demo(): ReactElement {
	const [isLocked, setIsLocked] = useState(true);
	const [isMuted, setIsMuted] = useState(false);

	return (
		<GridItem.Group aspect={1.2} columns={2}>
			<GridItem haptic="selection" onPress={() => setIsLocked((value) => !value)} testID="tile-lock">
				<GridItem.Media>
					<Icon icon={IconLock} />
				</GridItem.Media>
				<GridItem.Title>Front door</GridItem.Title>
				<GridItem.Description>{isLocked ? "Locked" : "Unlocked"}</GridItem.Description>
			</GridItem>
			<GridItem haptic="selection" onPress={() => setIsMuted((value) => !value)} testID="tile-bell">
				<GridItem.Media>
					<Icon icon={IconBell} />
				</GridItem.Media>
				<GridItem.Title>Doorbell</GridItem.Title>
				<GridItem.Description>{isMuted ? "Muted" : "Ringing"}</GridItem.Description>
			</GridItem>
			<GridItem haptic="light" onPress={() => {}} testID="tile-lights" variant="muted">
				<GridItem.Media>
					<Icon icon={IconSun} />
				</GridItem.Media>
				<GridItem.Title>Lights</GridItem.Title>
				<GridItem.Description>3 on</GridItem.Description>
			</GridItem>
			<GridItem isDisabled onPress={() => {}} testID="tile-camera">
				<GridItem.Media>
					<Icon icon={IconCamera1} />
				</GridItem.Media>
				<GridItem.Title>Camera</GridItem.Title>
				<GridItem.Description>Offline</GridItem.Description>
			</GridItem>
		</GridItem.Group>
	);
}
