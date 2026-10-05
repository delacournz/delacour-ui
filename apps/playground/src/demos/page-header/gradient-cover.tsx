import { PageHeader } from "@delacour/react-native-ui/page-header";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Gradient cover",
	caption:
		'With no picture the cover is a gradient — `primary` fading into the page by default, or two to four colours of your own. The rosette is drawn by `isVerified`, which also appends ", verified" to the avatar\'s spoken label.',
};

export function Demo(): ReactElement {
	return (
		<View className="gap-8">
			<PageHeader testID="page-header-gradient-default">
				<PageHeader.Cover testID="page-header-gradient-default-cover" />
				<PageHeader.Avatar isVerified name="Harbour Rowing Club" testID="page-header-gradient-default-avatar" />
				<PageHeader.Content>
					<PageHeader.Title>Harbour Rowing Club</PageHeader.Title>
				</PageHeader.Content>
			</PageHeader>
			<PageHeader testID="page-header-gradient-custom">
				<PageHeader.Cover colors={["chart-2", "chart-4", "background"]} testID="page-header-gradient-custom-cover" />
				<PageHeader.Avatar name="Night Market" testID="page-header-gradient-custom-avatar" />
				<PageHeader.Content>
					<PageHeader.Title>Night Market</PageHeader.Title>
				</PageHeader.Content>
			</PageHeader>
		</View>
	);
}
