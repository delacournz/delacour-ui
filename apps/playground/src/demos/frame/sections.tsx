import { Frame } from "@delacour/react-native-ui/frame";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sections",
	caption:
		"`Frame.Section` clusters rows under a caption inside one tray. A full-bleed rule sets each cluster off; rows within it keep the inset one.",
};

export function Demo(): ReactElement {
	return (
		<Frame>
			<Frame.Header>
				<Frame.Title>Privacy</Frame.Title>
				<Frame.Description>Who can see you, and what is kept.</Frame.Description>
			</Frame.Header>
			<Frame.Tray>
				<Frame.Section testID="frame-section-visibility" title="Visibility">
					<ListGroup.Item>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Profile</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Text.Caption>Everyone</Text.Caption>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
					<ListGroup.Item>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Last seen</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<Text.Caption>Contacts</Text.Caption>
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</Frame.Section>
				<Frame.Section testID="frame-section-data" title="Data">
					<ListGroup.Item>Download my data</ListGroup.Item>
					<ListGroup.Item>Clear search history</ListGroup.Item>
				</Frame.Section>
			</Frame.Tray>
		</Frame>
	);
}
