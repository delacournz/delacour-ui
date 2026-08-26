import { Button } from "@delacour/native-ui/button";
import { Tabs } from "@delacour/native-ui/tabs";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useCallback, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A tab inserted before the active one",
	note: "The selected tab does not change — its index does, because the list grew to its left. The pager has to jump rather than spring: sliding sideways here would be animating an edit the user did not make.",
};

function Panel({ label, tone }: { label: string; tone: string }): ReactElement {
	return (
		<View className={`h-28 items-center justify-center rounded-lg ${tone}`}>
			<Text.Header>{label}</Text.Header>
		</View>
	);
}

export function Demo(): ReactElement {
	const [ordered, setOrdered] = useState(["b", "c"]);
	const [insertedValue, setInsertedValue] = useState("b");
	const prependTab = useCallback(() => {
		setOrdered((current) => [`a${current.length}`, ...current]);
	}, []);

	return (
		<View className="gap-3">
			<Button onPress={prependTab} size="sm" testID="prepend-tab" variant="outline">
				Add a tab at the front
			</Button>
			<Tabs onValueChange={setInsertedValue} value={insertedValue}>
				<Tabs.List>
					<Tabs.ScrollView>
						<Tabs.Indicator />
						{ordered.map((value) => (
							<Tabs.Trigger key={value} testID={`inserted-${value}`} value={value}>
								{value}
							</Tabs.Trigger>
						))}
					</Tabs.ScrollView>
				</Tabs.List>
				{ordered.map((value) => (
					<Tabs.Content key={value} value={value}>
						<Panel label={value} tone="bg-tertiary" />
					</Tabs.Content>
				))}
			</Tabs>
		</View>
	);
}
