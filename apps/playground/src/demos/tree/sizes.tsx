import { Icon } from "@delacour/react-native-ui/icon";
import { IconBell, IconGlobe, IconLock } from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import { TREE_SIZES, Tree, type TreeSize } from "@delacour/react-native-ui/tree";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "`sm` rows are 36 points and `md` 44; the label, the glyph and the chevron's column step with them.",
	capture: { align: "stretch" },
};

const LABELS: Record<TreeSize, string> = {
	sm: "Small",
	md: "Medium",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			{TREE_SIZES.map((size) => (
				<View className="gap-3" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Tree defaultExpanded={["settings"]} size={size}>
						<Tree.Item value="settings">
							<Tree.Trigger testID={`tree-${size}-settings`}>
								<Tree.Icon>
									<Icon icon={IconGlobe} />
								</Tree.Icon>
								<Tree.Label>General</Tree.Label>
							</Tree.Trigger>
							<Tree.Group>
								<Tree.Item value="notifications">
									<Tree.Trigger>
										<Tree.Icon>
											<Icon icon={IconBell} />
										</Tree.Icon>
										<Tree.Label>Notifications</Tree.Label>
									</Tree.Trigger>
								</Tree.Item>
								<Tree.Item value="privacy">
									<Tree.Trigger>
										<Tree.Icon>
											<Icon icon={IconLock} />
										</Tree.Icon>
										<Tree.Label>Privacy</Tree.Label>
									</Tree.Trigger>
								</Tree.Item>
							</Tree.Group>
						</Tree.Item>
					</Tree>
				</View>
			))}
		</View>
	);
}
