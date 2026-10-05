import { Button } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconChatBubble7, IconMapPin } from "@delacour/react-native-ui/icons/central";
import { PageHeader } from "@delacour/react-native-ui/page-header";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Profile",
	caption:
		"Every part at once: a cover photo, a face lifted over its edge and ringed in the page colour, a title block, actions and a strip of stats. Compacted numbers are read in full — `1.2K` is announced as 1,234 Followers.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	const [isFollowing, setFollowing] = useState(false);
	const [opened, setOpened] = useState<string | null>(null);

	return (
		<PageHeader testID="page-header-profile">
			<PageHeader.Cover
				accessibilityLabel="Harbour at dusk"
				source={{ uri: "https://picsum.photos/seed/harbour/900/400" }}
				testID="page-header-profile-cover"
			/>
			<PageHeader.Avatar
				isVerified
				name="Kate Austen"
				source={{ uri: "https://i.pravatar.cc/240?img=47" }}
				testID="page-header-profile-avatar"
			/>
			<PageHeader.Content>
				<PageHeader.Title>Kate Austen</PageHeader.Title>
				<PageHeader.Meta icon={IconMapPin}>Auckland, New Zealand</PageHeader.Meta>
				<PageHeader.Description>
					Product designer. Weekends on the water, weekdays on type scales and spacing systems.
				</PageHeader.Description>
			</PageHeader.Content>
			<PageHeader.Actions>
				<Button
					accessibilityState={{ selected: isFollowing }}
					onPress={() => setFollowing((value) => !value)}
					testID="page-header-profile-follow"
					variant={isFollowing ? "secondary" : "primary"}
				>
					{isFollowing ? "Following" : "Follow"}
				</Button>
				<Button accessibilityLabel="Message" size="icon-md" variant="secondary">
					<Icon icon={IconChatBubble7} />
				</Button>
			</PageHeader.Actions>
			<PageHeader.Stats isDivided>
				<PageHeader.Stat
					label={opened === "followers" ? "Opened" : "Followers"}
					onPress={() => setOpened("followers")}
					testID="page-header-profile-followers"
					value={1234}
				/>
				<PageHeader.Stat label="Posts" testID="page-header-profile-posts" value={87} />
				<PageHeader.Stat label="Following" testID="page-header-profile-following" value={312} />
			</PageHeader.Stats>
		</PageHeader>
	);
}
