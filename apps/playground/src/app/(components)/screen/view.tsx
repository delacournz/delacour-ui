import { Button } from "@delacour/native-ui/button";
import { SCREEN_EDGES, Screen, type ScreenEdge } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";

/**
 * A non-scrolling body, and the safe-area edges `Screen.Content` can inset.
 *
 * `Screen.View` pads itself for whatever chrome is mounted — the animated
 * padding is read from the same measurements a scroll area's spacers use — and
 * falls back to the raw safe-area inset on an edge with no chrome on it. Toggle
 * the footer to watch the box shrink from the bottom with nothing said here.
 *
 * `Screen.Content`'s `insets` are separate and additive: they pad against the
 * device's safe area rather than against the screen's chrome, which is what a
 * screen with an overlay navbar wants when its content should still run under
 * the notch but not under the home indicator.
 */
export default function ScreenViewDemo(): ReactElement {
	const router = useRouter();
	const [showFooter, setShowFooter] = useState(true);
	const [edges, setEdges] = useState<ScreenEdge[]>([]);

	function toggleEdge(edge: ScreenEdge): void {
		setEdges((current) => (current.includes(edge) ? current.filter((one) => one !== edge) : [...current, edge]));
	}

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>Static body</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.Content insets={edges}>
				<Screen.View className="gap-4 px-5">
					<View className="flex-1 items-center justify-center gap-2 rounded-xl border border-border border-dashed">
						<Text.Title>Screen.View</Text.Title>
						<Text className="px-6 text-center text-muted-foreground text-sm">
							This box is padded for the navbar above and the footer below, both measured rather than named.
						</Text>
					</View>

					<View className="flex-row flex-wrap gap-2">
						{SCREEN_EDGES.map((edge) => (
							<Button
								key={edge}
								onPress={() => toggleEdge(edge)}
								size="sm"
								variant={edges.includes(edge) ? "primary" : "outline"}
							>
								{edge}
							</Button>
						))}
					</View>

					<Button onPress={() => setShowFooter((current) => !current)} size="sm" variant="secondary">
						{showFooter ? "Hide footer" : "Show footer"}
					</Button>
				</Screen.View>
			</Screen.Content>

			{showFooter ? (
				<Screen.Footer>
					<Button haptic="medium" onPress={() => router.back()}>
						Done
					</Button>
				</Screen.Footer>
			) : null}
		</Screen>
	);
}
