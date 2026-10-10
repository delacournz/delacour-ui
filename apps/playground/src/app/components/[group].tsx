import { Icon } from "@delacour/react-native-ui/icon";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Surface } from "@delacour/react-native-ui/surface";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import type { ReactElement } from "react";
import { BlockScreen } from "@/components/block-screen";
import { COMPONENT_ICONS } from "@/components/component-icons";
import { componentGroup } from "@/components-index";

/**
 * One docs group's galleries, alphabetical, one row each.
 *
 * The `[group]` segment is the group's slug from `components-index.ts`; a slug
 * no group has — a stale link, a typo — redirects to `/components` rather than
 * rendering an empty tray.
 */
export default function ComponentGroupScreen(): ReactElement {
	const router = useRouter();
	const { group: slug } = useLocalSearchParams<{ group: string }>();
	const group = componentGroup(slug);

	if (!group) return <Redirect href="/components" />;

	const count = group.entries.length;

	return (
		<BlockScreen subtitle={`${count} ${count === 1 ? "component" : "components"}`} title={group.name}>
			<Surface material="tray">
				<ListGroup className="rounded-xl">
					{group.entries.map((entry) => (
						<ListGroup.Item
							haptic="selection"
							key={entry.slug}
							onPress={() => router.push(entry.href)}
							testID={`components-${entry.slug}`}
						>
							<ListGroup.ItemPrefix>
								<Icon icon={COMPONENT_ICONS[entry.slug]} />
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
		</BlockScreen>
	);
}
