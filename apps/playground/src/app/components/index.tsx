import { Icon, type IconComponent } from "@delacour/react-native-ui/icon";
import { IconDiamond } from "@delacour/react-native-ui/icons/central";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { BlockScreen } from "@/components/block-screen";
import { GROUP_ICONS } from "@/components/component-icons";
import { type ComponentIndexEntry, componentCount, groupedComponents, groupSummary } from "@/components-index";
import { SECTION_GAP } from "@/tokens";

/**
 * Brand art, not part of the library — the row is a way to eyeball the app icon
 * against the component that redraws it, which is only ever a development
 * concern. `__DEV__` is compiled to `false` in a release bundle, so Metro's
 * dead-code pass drops the row and this group with it.
 */
const DEV_ROWS: readonly (ComponentIndexEntry & { icon: IconComponent })[] = [
	{
		slug: "delacour-mark",
		href: "/delacour-mark",
		icon: IconDiamond,
		title: "DelacourMark",
		description: "The app icon, as react-native-svg",
		group: "Utilities",
	},
];

/**
 * The docs' groups, one row each, every row opening `/components/<group>`.
 *
 * Forty-odd galleries on one scroll was a page nobody read to the bottom of;
 * eight rows fit a screen, and each says what is inside with its first few
 * titles. The groups are the docs' eight, in the docs' order, so a reader who
 * found a component on the site finds it under the same name here —
 * `components-index.test.ts` holds the two apps' groupings together.
 *
 * Framed by `BlockScreen`, the same chrome `/blocks` wears, so the hub's two
 * doors open onto the same kind of room.
 */
export default function Components(): ReactElement {
	const router = useRouter();
	const groups = groupedComponents();

	return (
		<BlockScreen subtitle={`${componentCount()} components · ${groups.length} groups`} title="Components">
			<Surface material="tray">
				<ListGroup className="rounded-xl">
					{groups.map((group) => (
						<ListGroup.Item
							haptic="selection"
							key={group.slug}
							onPress={() => router.push(group.href)}
							testID={`components-group-${group.slug}`}
						>
							<ListGroup.ItemPrefix>
								<Icon icon={GROUP_ICONS[group.name]} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{group.name}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{groupSummary(group.entries)}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>
			</Surface>

			{__DEV__ ? (
				<View className={SECTION_GAP}>
					<Text.Kicker>Development</Text.Kicker>
					<Surface material="tray">
						<ListGroup className="rounded-xl">
							{DEV_ROWS.map((entry) => (
								<ListGroup.Item haptic="selection" key={entry.slug} onPress={() => router.push(entry.href)}>
									<ListGroup.ItemPrefix>
										<Icon icon={entry.icon} />
									</ListGroup.ItemPrefix>
									<ListGroup.ItemContent>
										<ListGroup.ItemTitle>{entry.title}</ListGroup.ItemTitle>
										<ListGroup.ItemDescription>{entry.description}</ListGroup.ItemDescription>
									</ListGroup.ItemContent>
									<ListGroup.ItemSuffix />
								</ListGroup.Item>
							))}
						</ListGroup>
					</Surface>
				</View>
			) : null}
		</BlockScreen>
	);
}
