import { Button } from "@delacour/react-native-ui/button";
import { Tree } from "@delacour/react-native-ui/tree";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled expansion",
	caption:
		"`expanded` and `onExpandedChange` put the open branches in the caller's hands, so buttons outside the tree can open or close every one of them.",
};

const BRANCHES = ["animals", "animals/birds", "plants"] as const;

export function Demo(): ReactElement {
	const [expanded, setExpanded] = useState<readonly string[]>(["animals"]);

	return (
		<View className="gap-4">
			<View className="flex-row gap-2">
				<Button onPress={() => setExpanded(BRANCHES)} size="sm" testID="controlled-expand-all" variant="outline">
					Expand all
				</Button>
				<Button onPress={() => setExpanded([])} size="sm" testID="controlled-collapse-all" variant="outline">
					Collapse all
				</Button>
			</View>
			<Tree expanded={expanded} onExpandedChange={setExpanded}>
				<Tree.Item value="animals">
					<Tree.Trigger testID="controlled-animals">Animals</Tree.Trigger>
					<Tree.Group>
						<Tree.Item value="animals/birds">
							<Tree.Trigger testID="controlled-birds">Birds</Tree.Trigger>
							<Tree.Group>
								<Tree.Item value="animals/birds/kea">
									<Tree.Trigger>Kea</Tree.Trigger>
								</Tree.Item>
								<Tree.Item value="animals/birds/tui">
									<Tree.Trigger>Tūī</Tree.Trigger>
								</Tree.Item>
							</Tree.Group>
						</Tree.Item>
						<Tree.Item value="animals/tuatara">
							<Tree.Trigger>Tuatara</Tree.Trigger>
						</Tree.Item>
					</Tree.Group>
				</Tree.Item>
				<Tree.Item value="plants">
					<Tree.Trigger testID="controlled-plants">Plants</Tree.Trigger>
					<Tree.Group>
						<Tree.Item value="plants/kauri">
							<Tree.Trigger>Kauri</Tree.Trigger>
						</Tree.Item>
						<Tree.Item value="plants/pohutukawa">
							<Tree.Trigger>Pōhutukawa</Tree.Trigger>
						</Tree.Item>
					</Tree.Group>
				</Tree.Item>
			</Tree>
		</View>
	);
}
