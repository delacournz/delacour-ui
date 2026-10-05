import { FRAME_SIZES, Frame, type FrameSize } from "@delacour/react-native-ui/frame";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "Size steps the title and hands the tray the same ListGroup size, so the rows follow.",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<FrameSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{FRAME_SIZES.map((size) => (
				<Frame key={size} size={size}>
					<Frame.Header>
						<Frame.Title>{LABELS[size]}</Frame.Title>
					</Frame.Header>
					<Frame.Tray>
						<ListGroup.Item>Account</ListGroup.Item>
						<ListGroup.Item>Billing</ListGroup.Item>
					</Frame.Tray>
				</Frame>
			))}
		</View>
	);
}
