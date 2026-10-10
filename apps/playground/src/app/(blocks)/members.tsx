import { Avatar } from "@delacour/react-native-ui/avatar";
import { Badge, type BadgeColor } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMagnifyingGlass, IconPeopleAdd } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import { Item } from "@delacour/react-native-ui/item";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Tabs } from "@delacour/react-native-ui/tabs";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useMemo, useState } from "react";
import { View } from "react-native";
import {
	filterMembers,
	MEMBERS,
	type MemberStatus,
	ROLE_FILTERS,
	ROLE_LABELS,
	type RoleFilter,
	roleCounts,
} from "@/blocks/members";
import { BlockScreen } from "@/components/block-screen";
import { BlockSection } from "@/components/block-section";

const STATUS_COLOR: Record<MemberStatus, BadgeColor> = {
	active: "success",
	invited: "info",
	suspended: "destructive",
};

const STATUS_LABEL: Record<MemberStatus, string> = {
	active: "Active",
	invited: "Invited",
	suspended: "Suspended",
};

/**
 * Members: a search field, a role filter, and the people in a tray.
 *
 * The filter is a `Tabs` bar with no panels — the filter-row shape the tabs docs
 * describe — and the list below it is derived with `filterMembers`, so a query
 * that matches no one swaps the tray for an `EmptyState` whose action clears it.
 * Status is the only colour on the screen, carried by etched badges.
 */
export default function MembersBlock(): ReactElement {
	const [query, setQuery] = useState("");
	const [role, setRole] = useState<RoleFilter>("all");
	const counts = useMemo(() => roleCounts(MEMBERS), []);
	const people = filterMembers(MEMBERS, query, role);

	return (
		<BlockScreen keyboardAware subtitle={`${counts.all} people`} title="Members">
			<View className="gap-3">
				<Input.Group variant="etched">
					<Input.Group.Prefix>
						<Icon icon={IconMagnifyingGlass} />
					</Input.Group.Prefix>
					<Input
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={setQuery}
						placeholder="Search name or email"
						returnKeyType="search"
						testID="members-search"
						value={query}
					/>
				</Input.Group>
				<Tabs onValueChange={(value) => setRole(value as RoleFilter)} size="sm" value={role} variant="primary">
					<Tabs.List>
						<Tabs.ScrollView>
							<Tabs.Indicator />
							{ROLE_FILTERS.map((filter) => (
								<Tabs.Trigger key={filter} testID={`members-role-${filter}`} value={filter}>
									{`${ROLE_LABELS[filter]} ${counts[filter]}`}
								</Tabs.Trigger>
							))}
						</Tabs.ScrollView>
					</Tabs.List>
				</Tabs>
			</View>

			{people.length > 0 ? (
				<BlockSection kicker={`${people.length} ${people.length === 1 ? "person" : "people"}`}>
					<ListGroup className="rounded-xl">
						{people.map((member) => (
							<Item key={member.id} testID={`member-${member.id}`}>
								<Item.Media>
									<Avatar name={member.name} size="md" />
								</Item.Media>
								<Item.Content>
									<Item.Title numberOfLines={1}>{member.name}</Item.Title>
									<Item.Description numberOfLines={1}>{member.email}</Item.Description>
								</Item.Content>
								<Item.Actions>
									<View className="items-end gap-1">
										<Badge color={STATUS_COLOR[member.status]} material="etched" size="sm" variant="soft">
											{STATUS_LABEL[member.status]}
										</Badge>
										<Text.Kicker>{member.role}</Text.Kicker>
									</View>
								</Item.Actions>
							</Item>
						))}
					</ListGroup>
				</BlockSection>
			) : (
				<EmptyState testID="members-empty" variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconMagnifyingGlass} />
						</EmptyState.Media>
						<EmptyState.Title>No one matches</EmptyState.Title>
						<EmptyState.Description>Try a different name, or clear the filters.</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button
							material="etched"
							onPress={() => {
								setQuery("");
								setRole("all");
							}}
							size="sm"
							variant="outline"
						>
							Clear filters
						</Button>
					</EmptyState.Content>
				</EmptyState>
			)}

			<Button material="etched" variant="secondary">
				<Icon icon={IconPeopleAdd} />
				<Button.Label>Invite a member</Button.Label>
			</Button>
		</BlockScreen>
	);
}
