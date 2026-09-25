import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "No results",
	caption: "Type something that matches nothing. The empty state names the query, and its action clears the field.",
	keyboardAware: true,
};

const FRUIT = ["Apple", "Banana", "Cherry", "Feijoa", "Kiwifruit"] as const;

export function Demo(): ReactElement {
	const [query, setQuery] = useState("");
	const matches = FRUIT.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

	return (
		<View className="gap-3">
			<Input.Group>
				<Input.Group.Prefix>
					<Icon icon={IconMagnifyingGlass} />
				</Input.Group.Prefix>
				<Input onChangeText={setQuery} placeholder="Search fruit" testID="search" value={query} />
			</Input.Group>
			{matches.length > 0 ? (
				<ListGroup size="sm">
					{matches.map((name) => (
						<ListGroup.Item key={name}>{name}</ListGroup.Item>
					))}
				</ListGroup>
			) : (
				<EmptyState size="sm" testID="no-results" variant="card">
					<EmptyState.Header>
						<EmptyState.Media>
							<Icon icon={IconMagnifyingGlass} />
						</EmptyState.Media>
						<EmptyState.Title>No results for “{query.trim()}”</EmptyState.Title>
						<EmptyState.Description>Check the spelling or try a shorter search.</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button onPress={() => setQuery("")} size="sm" testID="clear-search" variant="secondary">
							Clear search
						</Button>
					</EmptyState.Content>
				</EmptyState>
			)}
		</View>
	);
}
