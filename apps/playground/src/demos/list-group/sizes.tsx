import { Icon } from "@delacour/native-ui/icon";
import { IconLock, IconUser } from "@delacour/native-ui/icons/central";
import { LIST_GROUP_SIZES, ListGroup } from "@delacour/native-ui/list-group";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "Size drives the row metrics, the type scale, both icon sizes and the divider inset together.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{LIST_GROUP_SIZES.map((size) => (
				<ListGroup key={size} size={size}>
					<ListGroup.Item testID={`row-${size}`}>
						<ListGroup.ItemPrefix>
							<Icon icon={IconUser} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>size {size}</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Name, email, phone number</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Icon icon={IconLock} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Security</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Password, two-factor</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
				</ListGroup>
			))}
		</View>
	);
}
