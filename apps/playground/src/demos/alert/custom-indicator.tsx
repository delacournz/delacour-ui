import { Alert } from "@delacour/react-native-ui/alert";
import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCloud } from "@delacour/react-native-ui/icons/central";
import { Spinner } from "@delacour/react-native-ui/spinner";
import { type ReactElement, useEffect, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom indicator",
	caption:
		"Children replace the status glyph and inherit its size and colour. Omit `Alert.Indicator` for a text-only alert.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	const [isDone, setDone] = useState(false);

	useEffect(() => {
		if (isDone) return;
		const timer = setTimeout(() => setDone(true), 2500);
		return () => clearTimeout(timer);
	}, [isDone]);

	return (
		<View className="gap-3">
			<Alert status={isDone ? "success" : "info"} testID="custom-sync">
				<Alert.Indicator>{isDone ? <Icon icon={IconCloud} /> : <Spinner />}</Alert.Indicator>
				<Alert.Content>
					<Alert.Title>{isDone ? "Library up to date" : "Syncing your library"}</Alert.Title>
					<Alert.Description>
						{isDone ? "342 photos backed up." : "Keep the app open until it finishes."}
					</Alert.Description>
					{isDone ? (
						<Alert.Action>
							<Button onPress={() => setDone(false)} size="sm" testID="custom-sync-again" variant="outline">
								Sync again
							</Button>
						</Alert.Action>
					) : null}
				</Alert.Content>
			</Alert>
			<Alert status="warning" testID="custom-text-only">
				<Alert.Content>
					<Alert.Title>Text only</Alert.Title>
					<Alert.Description>No indicator — the title and colour carry the status.</Alert.Description>
				</Alert.Content>
			</Alert>
		</View>
	);
}
