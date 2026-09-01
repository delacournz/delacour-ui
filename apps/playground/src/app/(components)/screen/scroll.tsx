import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconBug, IconLayoutTopBottom } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";

const ROWS = Array.from({ length: 24 }, (_, index) => index + 1);

/**
 * The default composition: an overlay navbar, a scrolling body, a footer.
 *
 * Nothing here names a safe-area inset or a footer height. The last row clears
 * the footer because the footer measured itself into the screen context and the
 * scroll area reserved exactly that — which is what the debug toggle makes
 * visible: the green occupancy band's top edge must land on the footer's red
 * one, and a red sliver above it would mean the reserve is short.
 */
export default function ScreenScrollDemo(): ReactElement {
	const router = useRouter();
	const [debug, setDebug] = useState(false);
	const [placement, setPlacement] = useState<"overlay" | "static">("overlay");

	return (
		<Screen debug={debug}>
			<Screen.Navbar
				actions={
					<Button
						accessibilityLabel="Toggle layout debugging"
						haptic="selection"
						onPress={() => setDebug((current) => !current)}
						size="icon-sm"
						variant={debug ? "primary" : "secondary"}
					>
						<Icon icon={IconBug} />
					</Button>
				}
				placement={placement}
			>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>Scroll + footer</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-4">
				<Screen.Header className="px-0">
					<Text.Caption>
						The navbar is {placement}, and draws its hairline at rest. The Navbar demo has the fadeBorderOnScroll
						toggle.
					</Text.Caption>
				</Screen.Header>

				<View className="flex-row gap-2">
					{(["overlay", "static"] as const).map((value) => (
						<Button
							key={value}
							onPress={() => setPlacement(value)}
							size="sm"
							variant={placement === value ? "primary" : "outline"}
						>
							{value}
						</Button>
					))}
				</View>

				<ListGroup>
					{ROWS.map((row) => (
						<ListGroup.Item key={row}>
							<ListGroup.ItemPrefix>
								<Icon icon={IconLayoutTopBottom} />
							</ListGroup.ItemPrefix>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Row {row}</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{row === ROWS.length ? "The last row must clear the footer" : "Scrolls under the navbar"}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
						</ListGroup.Item>
					))}
				</ListGroup>
			</Screen.ScrollArea>

			<Screen.Footer>
				<Button haptic="medium" onPress={() => router.back()}>
					Done
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
