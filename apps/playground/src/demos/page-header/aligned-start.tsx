import { Button } from "@delacour/react-native-ui/button";
import { IconCalendar1 } from "@delacour/react-native-ui/icons/central";
import { PageHeader } from "@delacour/react-native-ui/page-header";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Aligned to the start",
	caption:
		'`align="start"` puts a 64-point face and the text on the leading edge, for a header that shares the screen with a busier body. Inline stats run each value into its label.',
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<PageHeader align="start" testID="page-header-start">
			<PageHeader.Cover height={96} testID="page-header-start-cover" />
			<PageHeader.Avatar
				name="Oliver Lee"
				source={{ uri: "https://i.pravatar.cc/160?img=12" }}
				testID="page-header-start-avatar"
			/>
			<PageHeader.Content>
				<PageHeader.Title>Oliver Lee</PageHeader.Title>
				<PageHeader.Meta icon={IconCalendar1}>Joined March 2024</PageHeader.Meta>
			</PageHeader.Content>
			<PageHeader.Stats layout="inline">
				<PageHeader.Stat label="Followers" testID="page-header-start-followers" value={48_200} />
				<PageHeader.Stat label="Following" testID="page-header-start-following" value={530} />
			</PageHeader.Stats>
			<PageHeader.Actions>
				<Button size="sm">Follow</Button>
				<Button size="sm" variant="secondary">
					Message
				</Button>
			</PageHeader.Actions>
		</PageHeader>
	);
}
