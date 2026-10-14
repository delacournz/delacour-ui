import { GridItem } from "@delacour/react-native-ui/grid-item";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Row sizing",
	caption:
		"`aspect` makes a cell's height follow its width, so a cell stays square — or 2:1 — at any column count. `rowHeight` fixes the height in points instead, whatever the width.",
};

const COLUMNS = [3, 4] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{COLUMNS.map((columns) => (
				<View className="gap-2" key={columns}>
					<Text variant="label">{`${columns} columns, aspect 1`}</Text>
					<GridItem.Group columns={columns} gap={8} size="sm" variant="outline">
						{Array.from({ length: columns }, (_, index) => (
							<GridItem key={index}>
								<GridItem.Title>{`${index + 1}`}</GridItem.Title>
							</GridItem>
						))}
					</GridItem.Group>
				</View>
			))}
			<View className="gap-2">
				<Text variant="label">rowHeight 56</Text>
				<GridItem.Group columns={3} gap={8} rowHeight={56} size="sm" variant="muted">
					<GridItem colSpan={2}>
						<GridItem.Title>Wide</GridItem.Title>
					</GridItem>
					<GridItem>
						<GridItem.Title>One</GridItem.Title>
					</GridItem>
				</GridItem.Group>
			</View>
		</View>
	);
}
