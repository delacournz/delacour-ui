import { Button } from "@delacour/react-native-ui/button";
import { Card } from "@delacour/react-native-ui/card";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconHeart, IconImages1 } from "@delacour/react-native-ui/icons/central";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Media",
	caption:
		'The padding lives on the parts and the card clips, so media placed straight in it reaches the side edges. `className="pt-0"` bleeds it to the top as well.',
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isSaved, setSaved] = useState(false);

	return (
		<Card className="pt-0" testID="card-media">
			<View className="h-36 items-center justify-center bg-primary">
				<Icon color="primary-foreground" icon={IconImages1} size="2xl" />
			</View>
			<Card.Header>
				<Card.Title>Lake Tekapo</Card.Title>
				<Card.Description>Three nights, from $420.</Card.Description>
				<Card.Action>
					<Button
						accessibilityLabel={isSaved ? "Remove from saved" : "Save"}
						accessibilityState={{ selected: isSaved }}
						onPress={() => setSaved((saved) => !saved)}
						size="icon-sm"
						testID="card-media-save"
						variant={isSaved ? "primary" : "ghost"}
					>
						<Icon icon={IconHeart} />
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Footer variant="band">
				<Button className="flex-1" size="sm" testID="card-media-book">
					Book
				</Button>
			</Card.Footer>
		</Card>
	);
}
