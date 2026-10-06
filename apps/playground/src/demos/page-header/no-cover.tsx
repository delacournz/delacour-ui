import { Button } from "@delacour/react-native-ui/button";
import { PageHeader } from "@delacour/react-native-ui/page-header";
import { Skeleton } from "@delacour/react-native-ui/skeleton";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "No cover, and loading",
	caption:
		"Every part degrades on its own. With no cover the face does not lift. There is no skeleton part: while the data loads, swap the parts for `Skeleton`s of the same shape.",
};

export function Demo(): ReactElement {
	const [isLoading, setLoading] = useState(true);

	return (
		<View className="gap-6">
			<Button
				onPress={() => setLoading((value) => !value)}
				size="sm"
				testID="page-header-no-cover-toggle"
				variant="secondary"
			>
				{isLoading ? "Show loaded" : "Show loading"}
			</Button>
			{isLoading ? (
				<View className="items-center gap-3" testID="page-header-no-cover-skeleton">
					<Skeleton className="size-24" shape="circle" />
					<Skeleton className="h-6 w-40" shape="line" />
					<Skeleton className="h-4 w-56" shape="line" />
				</View>
			) : (
				<PageHeader testID="page-header-no-cover">
					<PageHeader.Avatar name="Priya Natarajan" testID="page-header-no-cover-avatar" />
					<PageHeader.Content>
						<PageHeader.Title>Priya Natarajan</PageHeader.Title>
						<PageHeader.Description>Coffee, cycling, and a backlog of half-read books.</PageHeader.Description>
					</PageHeader.Content>
				</PageHeader>
			)}
		</View>
	);
}
