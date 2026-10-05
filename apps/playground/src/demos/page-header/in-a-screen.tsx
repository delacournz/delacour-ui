import { Button } from "@delacour/react-native-ui/button";
import { PageHeader } from "@delacour/react-native-ui/page-header";
import { Screen } from "@delacour/react-native-ui/screen";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a Screen",
	caption:
		"Passed to `Screen.ScrollArea`'s `header`, under an overlay navbar. The cover runs under the status bar and the navbar with no gap, and takes the screen's side gutter back so it meets both edges.",
};

const POSTS = ["Morning row across the harbour", "New boat day", "Regatta results", "Winter training plan"] as const;

export function Demo(): ReactElement {
	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => {}} />
			</Screen.Navbar>
			<Screen.ScrollArea
				header={
					<PageHeader testID="page-header-screen">
						<PageHeader.Cover testID="page-header-screen-cover" />
						<PageHeader.Avatar isVerified name="Harbour Rowing Club" testID="page-header-screen-avatar" />
						<PageHeader.Content>
							<PageHeader.Title>Harbour Rowing Club</PageHeader.Title>
							<PageHeader.Description>Rowing on the Waitematā since 1871.</PageHeader.Description>
						</PageHeader.Content>
						<PageHeader.Actions>
							<Button size="sm">Join</Button>
						</PageHeader.Actions>
						<PageHeader.Stats isDivided>
							<PageHeader.Stat label="Members" testID="page-header-screen-members" value={342} />
							<PageHeader.Stat label="Events" testID="page-header-screen-events" value={18} />
						</PageHeader.Stats>
					</PageHeader>
				}
			>
				<View className="gap-4 pt-6">
					{POSTS.map((post) => (
						<Text.Paragraph key={post}>{post}</Text.Paragraph>
					))}
				</View>
			</Screen.ScrollArea>
		</Screen>
	);
}
