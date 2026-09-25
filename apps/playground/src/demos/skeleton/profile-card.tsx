import { Skeleton } from "@delacour/react-native-ui/skeleton";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sized by its content",
	caption:
		"Pass the real content as children and the placeholder takes its exact size — it is rendered invisibly underneath. Flip `isLoading` and the content fades in with nothing moving.",
	capture: { align: "stretch", flow: "skeleton/profile-card", hero: true },
};

export function Demo(): ReactElement {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<View className="gap-5">
			<View className="flex-row items-center justify-between">
				<Text.Label>Loading</Text.Label>
				<Switch
					accessibilityLabel="Loading"
					isSelected={isLoading}
					onSelectedChange={setIsLoading}
					testID="skeleton-loading"
				/>
			</View>
			<Skeleton.Group
				className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4"
				isLoading={isLoading}
				label="Loading profile"
			>
				<Skeleton shape="circle">
					<View className="size-12 items-center justify-center rounded-full bg-primary">
						<Text.Strong className="text-primary-foreground">AK</Text.Strong>
					</View>
				</Skeleton>
				<View className="flex-1 items-start gap-1">
					<Skeleton shape="line">
						<Text.Strong>Aroha King</Text.Strong>
					</Skeleton>
					<Skeleton shape="line">
						<Text.Caption>Product designer, Wellington</Text.Caption>
					</Skeleton>
				</View>
			</Skeleton.Group>
		</View>
	);
}
