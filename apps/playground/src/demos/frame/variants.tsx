import { FRAME_VARIANTS, Frame, type FrameVariant } from "@delacour/react-native-ui/frame";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`default` is a tinted shell with a narrow lip, `inset` sets the tray into a wider band, and `plain` paints nothing for a frame already inside a container.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<FrameVariant, string> = {
	default: "Default",
	plain: "Plain",
	inset: "Inset",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{FRAME_VARIANTS.map((variant) => (
				<Frame key={variant} testID={`frame-${variant}`} variant={variant}>
					<Frame.Header>
						<Frame.Title>{LABELS[variant]}</Frame.Title>
						<Frame.Action>Edit</Frame.Action>
					</Frame.Header>
					<Frame.Tray>
						<ListGroup.Item>Profile</ListGroup.Item>
						<ListGroup.Item>Security</ListGroup.Item>
					</Frame.Tray>
				</Frame>
			))}
		</View>
	);
}
