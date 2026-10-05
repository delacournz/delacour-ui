import { ListGroup } from "@delacour/react-native-ui/list-group";
import { ScrollHeader } from "@delacour/react-native-ui/scroll-header";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A bar with no large title",
	caption:
		"Without `ScrollHeader.Large` there is nothing to collapse: the bar title is always shown, and the surface and hairline arrive over the first 24 points of scroll — a navbar that says when there is content beneath it.",
};

const SETTINGS = [
	"Account",
	"Notifications",
	"Privacy",
	"Appearance",
	"Language",
	"Storage",
	"Downloads",
	"Accessibility",
	"Shortcuts",
	"Help",
	"About",
	"Sign out",
] as const;

export function Demo(): ReactElement {
	return (
		<View className="min-h-[600px] flex-1 overflow-hidden bg-background">
			<ScrollHeader>
				<ScrollHeader.Bar>
					<ScrollHeader.BarTitle>Settings</ScrollHeader.BarTitle>
				</ScrollHeader.Bar>
				<ScrollHeader.ScrollView
					contentContainerClassName="px-screen-gutter pt-2 pb-12"
					testID="scroll-header-settings"
				>
					<ListGroup>
						{SETTINGS.map((setting) => (
							<ListGroup.Item key={setting}>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{setting}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
							</ListGroup.Item>
						))}
					</ListGroup>
				</ScrollHeader.ScrollView>
			</ScrollHeader>
		</View>
	);
}
