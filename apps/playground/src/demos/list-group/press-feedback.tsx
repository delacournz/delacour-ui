import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { PRESSABLE_FEEDBACKS } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Press feedback",
	caption:
		"`fade` is the default: a full-bleed row that scales reads as the whole card flexing. `scale-fade` does both at once.",
};

export function Demo(): ReactElement {
	const [pressCount, setPressCount] = useState(0);

	const bump = () => setPressCount((n) => n + 1);

	return (
		<View className="gap-3">
			<ListGroup>
				{PRESSABLE_FEEDBACKS.map((feedback) => (
					<ListGroup.Item
						feedback={feedback}
						haptic="selection"
						key={feedback}
						onPress={bump}
						testID={`row-${feedback}`}
					>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{feedback}</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Icon color="muted-foreground" icon={IconArrowRight} size={16} />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				))}
			</ListGroup>
			<Text.Caption>{`Pressed ${pressCount} times`}</Text.Caption>
		</View>
	);
}
