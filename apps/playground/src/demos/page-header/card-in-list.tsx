import { Button } from "@delacour/react-native-ui/button";
import { PageHeader } from "@delacour/react-native-ui/page-header";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Card in a list",
	caption:
		'`variant="card"` is a clipped `Surface`: the cover is cut by its corner, the ring matches the card instead of the page, and nothing reaches under the status bar. A column of them is a list of people.',
	capture: { align: "stretch" },
};

const PEOPLE = [
	{ id: "lena", name: "Lena Varga", role: "Photographer", photo: "https://i.pravatar.cc/160?img=26", followers: 9_400 },
	{ id: "kenji", name: "Kenji Moriyama", role: "Illustrator", followers: 1_250_000 },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			{PEOPLE.map((person) => (
				<PageHeader key={person.id} testID={`page-header-card-${person.id}`} variant="card">
					<PageHeader.Cover height={72} testID={`page-header-card-${person.id}-cover`} />
					<PageHeader.Avatar
						name={person.name}
						size="xl"
						source={"photo" in person ? { uri: person.photo } : undefined}
						testID={`page-header-card-${person.id}-avatar`}
					/>
					<PageHeader.Content>
						<PageHeader.Title>{person.name}</PageHeader.Title>
						<PageHeader.Description numberOfLines={1}>{person.role}</PageHeader.Description>
					</PageHeader.Content>
					<PageHeader.Stats>
						<PageHeader.Stat
							label="Followers"
							testID={`page-header-card-${person.id}-followers`}
							value={person.followers}
						/>
					</PageHeader.Stats>
					<PageHeader.Actions>
						<Button size="sm">Follow</Button>
					</PageHeader.Actions>
				</PageHeader>
			))}
		</View>
	);
}
