import { Avatar } from "@delacour/react-native-ui/avatar";
import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { EmptyState } from "@delacour/react-native-ui/empty-state";
import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import {
	IconBell,
	IconChart1,
	IconFileText,
	IconHome,
	IconInboxEmpty,
	IconUser,
} from "@delacour/react-native-ui/icons/central";
import { Item } from "@delacour/react-native-ui/item";
import { Kpi } from "@delacour/react-native-ui/kpi";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Screen } from "@delacour/react-native-ui/screen";
import { Tabs } from "@delacour/react-native-ui/tabs";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { ACTIVITY, SHELL_TABS, type ShellTab } from "@/blocks/shell-data";
import { BlockSection } from "@/components/block-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { LIST_GAP, SECTION_GAP } from "@/tokens";

const TAB_ICONS: Record<ShellTab, IconComponent> = {
	home: IconHome,
	activity: IconChart1,
	inbox: IconInboxEmpty,
	profile: IconUser,
};

function HomeTab(): ReactElement {
	return (
		<>
			<View className={SECTION_GAP}>
				<Text.Kicker>Today</Text.Kicker>
				<Kpi material="etched" size="sm">
					<Kpi.Content layout="inline">
						<Kpi.Stat>
							<Kpi.Title>Active members</Kpi.Title>
							<Kpi.Value>1,284</Kpi.Value>
							<Kpi.Trend value={3.1} />
						</Kpi.Stat>
						<Kpi.Sparkline data={[14, 16, 15, 19, 18, 22, 21, 25]} interactive={false} />
					</Kpi.Content>
				</Kpi>
			</View>
			<BlockSection kicker="Recent">
				<ListGroup className="rounded-xl">
					{ACTIVITY.slice(0, 3).map((entry) => (
						<Item key={entry.id}>
							<Item.Media variant="icon">
								<Icon icon={IconFileText} />
							</Item.Media>
							<Item.Content>
								<Item.Title numberOfLines={1}>{entry.title}</Item.Title>
								<Item.Description>{entry.when}</Item.Description>
							</Item.Content>
						</Item>
					))}
				</ListGroup>
			</BlockSection>
		</>
	);
}

function ActivityTab(): ReactElement {
	return (
		<BlockSection kicker={`${ACTIVITY.length} events`}>
			<ListGroup className="rounded-xl">
				{ACTIVITY.map((entry) => (
					<Item key={entry.id}>
						<Item.Media variant="icon">
							<Icon icon={IconFileText} />
						</Item.Media>
						<Item.Content>
							<Item.Title numberOfLines={1}>{entry.title}</Item.Title>
							<Item.Description>{entry.when}</Item.Description>
						</Item.Content>
					</Item>
				))}
			</ListGroup>
		</BlockSection>
	);
}

function InboxTab(): ReactElement {
	return (
		<EmptyState variant="card">
			<EmptyState.Header>
				<EmptyState.Media variant="icon">
					<Icon icon={IconBell} />
				</EmptyState.Media>
				<EmptyState.Title>You are all caught up</EmptyState.Title>
				<EmptyState.Description>Mentions and replies will show up here.</EmptyState.Description>
			</EmptyState.Header>
		</EmptyState>
	);
}

function ProfileTab(): ReactElement {
	return (
		<View className="items-center gap-3 py-6">
			<Avatar name="Rawiri Kemp" size="xl" />
			<View className="items-center gap-1">
				<Text.Title>Rawiri Kemp</Text.Title>
				<Text.Kicker>Admin</Text.Kicker>
			</View>
			<Button material="etched" size="sm" variant="outline">
				Edit profile
			</Button>
		</View>
	);
}

const TAB_BODIES: Record<ShellTab, () => ReactElement> = {
	home: HomeTab,
	activity: ActivityTab,
	inbox: InboxTab,
	profile: ProfileTab,
};

/**
 * App shell: a navbar over a tab's content, and a tab bar in the sticky footer.
 *
 * The bar is `Tabs` with no panels — triggers driving the state held here — so it
 * gets the library's sliding indicator and press feedback and the shell writes no
 * tab code of its own. Each trigger stacks its glyph over its label. The inbox
 * carries a count badge, which sits inside the trigger and so does not change its
 * width. Only the body swaps; the navbar's title follows the tab.
 */
export default function ShellBlock(): ReactElement {
	const router = useRouter();
	const [tab, setTab] = useState<ShellTab>("home");
	const Body = TAB_BODIES[tab];
	const current = SHELL_TABS.find((entry) => entry.id === tab);

	return (
		<Screen>
			<Screen.Navbar actions={<ThemeToggle />}>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>{current?.title ?? ""}</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>App shell</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>
			<Screen.ScrollArea contentContainerClassName={LIST_GAP}>
				<Body />
			</Screen.ScrollArea>
			<Screen.Footer sticky>
				<Tabs onValueChange={(value) => setTab(value as ShellTab)} size="sm" value={tab} variant="primary">
					<Tabs.List>
						<Tabs.Indicator />
						{SHELL_TABS.map((entry) => (
							<Tabs.Trigger
								accessibilityLabel={entry.title}
								className="flex-col gap-1 px-1 py-2"
								key={entry.id}
								testID={`shell-tab-${entry.id}`}
								value={entry.id}
							>
								<Icon icon={TAB_ICONS[entry.id]} />
								<Tabs.Label>{entry.title}</Tabs.Label>
								{entry.id === "inbox" ? (
									<Badge className="absolute top-1 right-3" color="destructive" size="sm">
										2
									</Badge>
								) : null}
							</Tabs.Trigger>
						))}
					</Tabs.List>
				</Tabs>
			</Screen.Footer>
		</Screen>
	);
}
