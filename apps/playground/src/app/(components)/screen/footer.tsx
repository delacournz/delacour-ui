import { Button } from "@delacour/native-ui/button";
import { Screen, type ScreenPlacement } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { TextInput, View } from "react-native";
import { Section } from "@/components/section";

/**
 * The footer's placements, and what `sticky` changes.
 *
 * `overlay` floats it over the content, which insets itself by the measured
 * height. `static` puts it in the flow, taking its own space — visible here as
 * the scroll area ending above it rather than behind it.
 *
 * `sticky` is the keyboard axis and is orthogonal to placement: focus the input
 * and a sticky footer rides up with the keyboard, a non-sticky one stays put
 * and is covered by it.
 */
export default function ScreenFooterDemo(): ReactElement {
	const router = useRouter();
	const [placement, setPlacement] = useState<ScreenPlacement>("overlay");
	const [sticky, setSticky] = useState(true);
	const [twoUp, setTwoUp] = useState(false);
	const [fadeBorderOnScroll, setFadeBorderOnScroll] = useState(false);
	const [draft, setDraft] = useState("");

	return (
		<Screen>
			<Screen.Navbar placement="static">
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>Footer</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6">
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
				</Section>

				<Section title="Keyboard">
					<View className="flex-row gap-2">
						<Button onPress={() => setSticky(true)} size="sm" variant={sticky ? "primary" : "outline"}>
							sticky
						</Button>
						<Button onPress={() => setSticky(false)} size="sm" variant={sticky ? "outline" : "primary"}>
							fixed
						</Button>
					</View>
					<TextInput
						className="h-button-md rounded-lg border border-border bg-card px-3 text-base text-foreground"
						onChangeText={setDraft}
						placeholder="Focus me to move the keyboard"
						placeholderTextColor="#9CA3AF"
						value={draft}
					/>
					<Text.Caption>
						{sticky
							? "The footer rides the keyboard and sits flush on top of it."
							: "The footer stays put and the keyboard covers it."}
					</Text.Caption>
				</Section>

				<Section title="Top hairline">
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
							fade at the end
						</Button>
					</View>
					<Text.Caption>
						{placement === "overlay"
							? "Only a static footer draws one — an overlay footer floats over the content."
							: fadeBorderOnScroll
								? "Drawn while there is content below, fading out over the last 20pt of the scroll."
								: "Drawn from the first frame, separating the footer from the content above it."}
					</Text.Caption>
				</Section>

				<Section title="Content">
					<Button onPress={() => setTwoUp((current) => !current)} size="sm" variant="outline">
						{twoUp ? "One action" : "Two actions"}
					</Button>
					<Text.Caption>
						The footer measures its content, so growing it re-reserves the scroll area's clearance with nothing said at
						the call site.
					</Text.Caption>
				</Section>

				{Array.from({ length: 14 }, (_, index) => (
					<Text className="text-foreground" key={index}>
						Scroll row {index + 1} — the last one must clear the footer
					</Text>
				))}
			</Screen.ScrollArea>

			<Screen.Footer fadeBorderOnScroll={fadeBorderOnScroll} placement={placement} sticky={sticky}>
				{twoUp ? (
					<View className="flex-row gap-2">
						<Button className="flex-1" onPress={() => router.back()} variant="outline">
							Cancel
						</Button>
						<Button className="flex-1" haptic="medium" onPress={() => router.back()}>
							Save
						</Button>
					</View>
				) : (
					<Button haptic="medium" onPress={() => router.back()}>
						Save
					</Button>
				)}
			</Screen.Footer>
		</Screen>
	);
}
