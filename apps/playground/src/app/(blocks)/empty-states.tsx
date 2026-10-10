import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon } from "@delacour/react-native-ui/icon";
import {
	IconBell,
	IconFolder1,
	IconInboxEmpty,
	IconMagnifyingGlass,
	IconPlusSmall,
	IconWifiNoSignal,
} from "@delacour/react-native-ui/icons/central";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { BlockScreen } from "@/components/block-screen";
import { SECTION_GAP } from "@/tokens";

/**
 * Empty states in four contexts: first run, a clean inbox, no results and offline.
 *
 * Each says what is missing, why that is fine or not, and offers at most one way
 * out. The first-run state is the `card` variant, the slot waiting to be filled;
 * the others are the `default` variant inside a bordered frame, so they read as a
 * screen's whole body rather than a card among cards.
 */
export default function EmptyStatesBlock(): ReactElement {
	return (
		<BlockScreen subtitle="Block" title="Empty states">
			<View className={SECTION_GAP}>
				<Text.Kicker>First run</Text.Kicker>
				<EmptyState variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconFolder1} />
						</EmptyState.Media>
						<EmptyState.Title>No projects yet</EmptyState.Title>
						<EmptyState.Description>
							Create a project to start collecting your work in one place.
						</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button material="etched" size="sm">
							<Icon icon={IconPlusSmall} />
							<Button.Label>New project</Button.Label>
						</Button>
					</EmptyState.Content>
				</EmptyState>
			</View>

			<View className={SECTION_GAP}>
				<Text.Kicker>All caught up</Text.Kicker>
				<EmptyState size="sm" variant="card">
					<EmptyState.Header>
						<EmptyState.Media>
							<Icon icon={IconInboxEmpty} />
						</EmptyState.Media>
						<EmptyState.Title>Inbox zero</EmptyState.Title>
						<EmptyState.Description>New messages will land here.</EmptyState.Description>
					</EmptyState.Header>
				</EmptyState>
			</View>

			<View className={SECTION_GAP}>
				<Text.Kicker>No results</Text.Kicker>
				<EmptyState size="sm" variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconMagnifyingGlass} />
						</EmptyState.Media>
						<EmptyState.Title>Nothing for “kauri”</EmptyState.Title>
						<EmptyState.Description>Check the spelling or search for something broader.</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button material="etched" size="sm" variant="outline">
							Clear search
						</Button>
					</EmptyState.Content>
				</EmptyState>
			</View>

			<View className={SECTION_GAP}>
				<Text.Kicker>Offline</Text.Kicker>
				<EmptyState size="sm" variant="card">
					<EmptyState.Header>
						<EmptyState.Media variant="icon">
							<Icon icon={IconWifiNoSignal} />
						</EmptyState.Media>
						<EmptyState.Title>You are offline</EmptyState.Title>
						<EmptyState.Description>Reconnect to load your notifications.</EmptyState.Description>
					</EmptyState.Header>
					<EmptyState.Content>
						<Button material="etched" size="sm" variant="secondary">
							<Icon icon={IconBell} />
							<Button.Label>Try again</Button.Label>
						</Button>
					</EmptyState.Content>
				</EmptyState>
			</View>
		</BlockScreen>
	);
}
