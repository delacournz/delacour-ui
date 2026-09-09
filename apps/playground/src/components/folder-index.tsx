import { Icon, type IconComponent } from "delacour-react-native-ui/icon";
import { ListGroup } from "delacour-react-native-ui/list-group";
import { Screen } from "delacour-react-native-ui/screen";
import { type Href, useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { ThemeTrigger } from "@/components/theme/theme-trigger";
import { ThemeToggle } from "@/components/theme-toggle";

export type FolderIndexItem = {
	readonly href: Href;
	readonly icon: IconComponent;
	readonly title: string;
	readonly description: string;
};

export type FolderIndexProps = {
	title: string;
	items: readonly FolderIndexItem[];
	/**
	 * The word the subtitle counts. `variations` for a component whose facets
	 * are its behaviours; Chart says `chart types`, because that is what its
	 * eight rows are.
	 *
	 * @default "variations"
	 */
	unit?: string;
};

/**
 * A component's facets, one row each — the index a folder route renders.
 *
 * Six routes used to write this by hand, and they had drifted: five said
 * "variations" and one said "chart types", five carried a paragraph of prose
 * under the list and each paragraph was a different length, and none of them
 * had the theme toggle every gallery beneath them carries. One component means
 * one shape, and the drift cannot come back a file at a time.
 *
 * The prose is gone on purpose. The pager already removed `meta.caption` from
 * every demo page because a paragraph above a control outweighed the control;
 * a paragraph under a list of five rows was doing the same to the list.
 *
 * The navbar carries `ThemeToggle`, as `DemoPager` and `GalleryScreen` do, and
 * `ThemeTrigger` beside it, as the home screen does. A folder index is one tap
 * short of a gallery, and a screen whose chrome cannot flip the theme beside
 * one that can reads as a bug in whichever you reached second; and it is a
 * screen that navigates rather than demonstrates, which is where the
 * customiser's action lives now that it no longer floats over demo footers.
 *
 * The title and subtitle ride the back button, the way every other gallery's
 * do, so the whole "‹ Tabs / 5 variations" block goes back and the list starts
 * at the top of the viewport.
 */
export function FolderIndex({ title, items, unit = "variations" }: FolderIndexProps): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar
				actions={
					<>
						<ThemeTrigger />
						<ThemeToggle />
					</>
				}
				placement="static"
			>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>{title}</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>{`${items.length} ${unit}`}</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea>
				<ListGroup>
					{items.map((item) => (
						<ListGroup.Item haptic="selection" key={item.title} onPress={() => router.push(item.href)}>
							<ListGroup.ItemPrefix>
								<Icon icon={item.icon} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{item.title}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>{item.description}</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					))}
				</ListGroup>
			</Screen.ScrollArea>
			<Screen.ScrollShadow />
		</Screen>
	);
}
FolderIndex.displayName = "Playground.FolderIndex";
