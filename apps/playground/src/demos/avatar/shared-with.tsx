import { Avatar } from "@delacour/react-native-ui/avatar";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCheckmark1Small } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Shared with",
	caption:
		"A realistic composition: tap a person to share with them, and the stack above updates. The stack is capped at three faces and counts the rest. The row already names the person, so its avatar is hidden from screen readers rather than read twice.",
};

const PEOPLE = [
	{ id: "kate", name: "Kate Austen", role: "Owner", photo: "https://i.pravatar.cc/160?img=47" },
	{ id: "oliver", name: "Oliver Lee", role: "Editor", photo: "https://i.pravatar.cc/160?img=12" },
	{ id: "chen", name: "Chen Wei", role: "Editor" },
	{ id: "dana", name: "Dana Kim", role: "Viewer", photo: "https://i.pravatar.cc/160?img=32" },
	{ id: "ana", name: "Ana Silva", role: "Viewer" },
] as const;

type PersonId = (typeof PEOPLE)[number]["id"];

export function Demo(): ReactElement {
	const [shared, setShared] = useState<ReadonlySet<PersonId>>(new Set(["kate", "oliver", "chen", "dana"]));

	const toggle = (id: PersonId) =>
		setShared((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const chosen = PEOPLE.filter((person) => shared.has(person.id));

	return (
		<View className="gap-4">
			<View className="flex-row items-center gap-3">
				<Avatar.Group max={3} size="sm" testID="shared-stack">
					{chosen.map((person) => (
						<Avatar key={person.id} name={person.name} source={"photo" in person ? { uri: person.photo } : undefined} />
					))}
				</Avatar.Group>
				<Text.Caption color="muted" testID="shared-count">
					{chosen.length === 0 ? "Only you" : `Shared with ${chosen.length}`}
				</Text.Caption>
			</View>
			<ListGroup>
				{PEOPLE.map((person) => {
					const isShared = shared.has(person.id);
					return (
						<ListGroup.Item
							accessibilityState={{ selected: isShared }}
							haptic="selection"
							key={person.id}
							onPress={() => toggle(person.id)}
							testID={`share-${person.id}`}
						>
							<ListGroup.ItemPrefix>
								<Avatar
									accessibilityElementsHidden
									importantForAccessibility="no-hide-descendants"
									name={person.name}
									size="sm"
									source={"photo" in person ? { uri: person.photo } : undefined}
								/>
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{person.name}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{person.role}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix>
								{isShared ? <Icon color="primary" icon={IconCheckmark1Small} /> : <View />}
							</ListGroup.ItemSuffix>
						</ListGroup.Item>
					);
				})}
			</ListGroup>
		</View>
	);
}
