import { Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconMagnifyingGlass, IconSettingsGear1 } from "delacour-react-native-ui/icons/central";
import { Screen, type ScreenPlacement } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { Section } from "@/components/section";

const LAYOUTS = ["back + title", "title + subtitle", "centre + actions", "close only"] as const;

type Layout = (typeof LAYOUTS)[number];

/**
 * Every way the navbar's three slots can be filled.
 *
 * The leading slot, the trailing `actions` and the absolutely centred `center`
 * are independent: a long leading title cannot push the centre off centre, and
 * `pointerEvents="box-none"` throughout means the bar never swallows a tap
 * meant for the content underneath.
 *
 * Actions are ordinary `Button`s. There is no `Navbar.Action` restating the
 * loading, sizing and haptics vocabulary `Button` already owns.
 */
export default function ScreenNavbarDemo(): ReactElement {
	const router = useRouter();
	const [layout, setLayout] = useState<Layout>("back + title");
	const [placement, setPlacement] = useState<ScreenPlacement>("overlay");
	const [fadeBorderOnScroll, setFadeBorderOnScroll] = useState(false);

	const actions =
		layout === "centre + actions" ? (
			<>
				<Button accessibilityLabel="Search" size="icon-sm" variant="secondary">
					<Icon icon={IconMagnifyingGlass} />
				</Button>
				<Button accessibilityLabel="Settings" size="icon-sm" variant="secondary">
					<Icon icon={IconSettingsGear1} />
				</Button>
			</>
		) : undefined;

	return (
		<Screen>
			<Screen.Navbar
				actions={actions}
				center={layout === "centre + actions" ? <Screen.Navbar.Title>Inbox</Screen.Navbar.Title> : undefined}
				fadeBorderOnScroll={fadeBorderOnScroll}
				placement={placement}
			>
				{layout === "back + title" ? (
					<Screen.Navbar.BackButton onPress={() => router.back()}>
						<Screen.Navbar.Title>Settings</Screen.Navbar.Title>
					</Screen.Navbar.BackButton>
				) : null}

				{layout === "title + subtitle" ? (
					<>
						<Screen.Navbar.BackButton onPress={() => router.back()} />
						<View className="min-w-0 flex-1">
							<Screen.Navbar.Title>Ada Lovelace</Screen.Navbar.Title>
							<Screen.Navbar.Subtitle>+64 21 555 0142</Screen.Navbar.Subtitle>
						</View>
					</>
				) : null}

				{layout === "centre + actions" ? <Screen.Navbar.BackButton onPress={() => router.back()} /> : null}

				{layout === "close only" ? <Screen.Navbar.BackButton glyph="close" onPress={() => router.back()} /> : null}
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6">
				<Section title="Layout">
					<View className="flex-row flex-wrap gap-2">
						{LAYOUTS.map((value) => (
							<Button
								key={value}
								onPress={() => setLayout(value)}
								size="sm"
								variant={layout === value ? "primary" : "outline"}
							>
								{value}
							</Button>
						))}
					</View>
				</Section>

				<Section title="Placement">
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
					<Text.Caption>
						{placement === "overlay"
							? "Content scrolls under the bar, which floats over it."
							: "The bar sits in the flow. Content starts below it and never passes beneath."}
					</Text.Caption>
				</Section>

				<Section title="Bottom hairline">
					<View className="flex-row gap-2">
						<Button
							onPress={() => setFadeBorderOnScroll(false)}
							size="sm"
							variant={fadeBorderOnScroll ? "outline" : "primary"}
						>
							always
						</Button>
						<Button
							onPress={() => setFadeBorderOnScroll(true)}
							size="sm"
							variant={fadeBorderOnScroll ? "primary" : "outline"}
						>
							fade on scroll
						</Button>
					</View>
					<Text.Caption>
						{fadeBorderOnScroll
							? "Undivided at rest. Scroll and the line ramps in over the first 20pt."
							: "Drawn from the first frame, so content starting flush against the bar still reads as separate."}
					</Text.Caption>
				</Section>

				<Section title="Long titles">
					<Text.Caption>
						Pick “title + subtitle”. The leading slot is min-w-0 and flex-1, so a long name truncates to one line rather
						than pushing the actions off the right edge.
					</Text.Caption>
				</Section>

				{Array.from({ length: 12 }, (_, index) => (
					<Text className="text-foreground" key={index}>
						Scroll row {index + 1}
					</Text>
				))}
			</Screen.ScrollArea>
		</Screen>
	);
}
