import { Button } from "@delacour/react-native-ui/button";
import { PageHeader } from "@delacour/react-native-ui/page-header";
import { Screen } from "@delacour/react-native-ui/screen";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "In a Screen",
	caption:
		"Passed to `Screen.ScrollArea`'s `header`, under an overlay navbar. The cover runs under the status bar and the navbar with no gap, takes the screen's side gutter back so it meets both edges, and scrolls away with the content.",
	capture: { flow: "page-header/in-a-screen", frame: "device", hero: true },
};

const POSTS = [
	"Morning row across the harbour",
	"New boat day",
	"Regatta results",
	"Winter training plan",
	"Learn-to-row course opens",
	"Clubhouse working bee",
	"Masters crew wins gold",
	"Summer timetable",
] as const;

export function Demo(): ReactElement {
	const [isMember, setMember] = useState(false);

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => {}} />
			</Screen.Navbar>
			<Screen.ScrollArea
				testID="page-header-screen-scroll"
				header={
					<PageHeader testID="page-header-screen">
						<PageHeader.Cover testID="page-header-screen-cover" />
						<PageHeader.Avatar isVerified name="Harbour Rowing Club" testID="page-header-screen-avatar" />
						<PageHeader.Content>
							<PageHeader.Title>Harbour Rowing Club</PageHeader.Title>
							<PageHeader.Description>Rowing on the Waitematā since 1871.</PageHeader.Description>
						</PageHeader.Content>
						<PageHeader.Actions>
							<Button
								accessibilityState={{ selected: isMember }}
								onPress={() => setMember((value) => !value)}
								size="sm"
								testID="page-header-screen-join"
								variant={isMember ? "secondary" : "primary"}
							>
								{isMember ? "Joined" : "Join"}
							</Button>
						</PageHeader.Actions>
						<PageHeader.Stats isDivided>
							<PageHeader.Stat label="Members" testID="page-header-screen-members" value={isMember ? 343 : 342} />
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
