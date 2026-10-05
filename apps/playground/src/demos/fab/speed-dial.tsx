import { Fab } from "@delacour/react-native-ui/fab";
import { IconImages1, IconPaperclip1, IconPlusLarge, IconTrashCan } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Speed dial",
	caption:
		"`Fab.Group` unfolds a dial of related actions over a scrim, on one spring with a stagger. The plus turns into a cross. Tap an action, the scrim or the cross to fold it away.",
	capture: { align: "stretch", flow: "fab/speed-dial", hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="h-96 overflow-hidden rounded-xl border border-border bg-background">
			<Fab.Group accessibilityLabel="Add something" icon={IconPlusLarge} isSafeAreaAware={false} testID="fab-dial">
				<Fab.Action icon={IconImages1} label="Photo" onPress={() => {}} testID="fab-dial-photo" />
				<Fab.Action icon={IconPaperclip1} label="Attachment" onPress={() => {}} />
				<Fab.Action icon={IconTrashCan} isDestructive label="Empty drafts" onPress={() => {}} />
			</Fab.Group>
		</View>
	);
}
