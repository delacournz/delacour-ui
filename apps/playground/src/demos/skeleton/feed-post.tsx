import { Button } from "@delacour/react-native-ui/button";
import { Skeleton } from "@delacour/react-native-ui/skeleton";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A feed post",
	caption:
		"A realistic loading state: the placeholders match the post they stand in for, so the layout does not jump when it lands. Reload fakes a slow request.",
	capture: { align: "stretch" },
};

/** How long the fake request takes. */
const LATENCY_MS = 2500;

const BODY =
	"Walked the Tongariro crossing before sunrise. The Emerald Lakes were steaming, and nobody else was up there yet.";

export function Demo(): ReactElement {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!isLoading) return;
		const timer = setTimeout(() => setIsLoading(false), LATENCY_MS);
		return () => clearTimeout(timer);
	}, [isLoading]);

	return (
		<View className="gap-4">
			<Skeleton.Group
				className="gap-3 rounded-lg border border-border bg-card p-4"
				isLoading={isLoading}
				label="Loading post"
			>
				<View className="flex-row items-center gap-3">
					<Skeleton shape="circle">
						<View className="size-10 rounded-full bg-success" />
					</Skeleton>
					<View className="flex-1 items-start gap-1">
						<Skeleton shape="line">
							<Text.Strong>Mere Tane</Text.Strong>
						</Skeleton>
						<Skeleton shape="line">
							<Text.Caption>2 hours ago</Text.Caption>
						</Skeleton>
					</View>
				</View>
				<Skeleton.Lines className="gap-2 py-1" lineClassName="h-4" lines={4}>
					<Text.Paragraph>{BODY}</Text.Paragraph>
				</Skeleton.Lines>
				<Skeleton className="h-40 w-full">
					<View className="h-40 w-full rounded-lg bg-info" />
				</Skeleton>
			</Skeleton.Group>
			<Button isDisabled={isLoading} onPress={() => setIsLoading(true)} testID="skeleton-reload" variant="secondary">
				Reload
			</Button>
		</View>
	);
}
