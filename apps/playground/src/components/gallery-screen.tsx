import { Screen } from "@delacour/native-ui/screen";
import { useRouter } from "expo-router";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

export type GalleryScreenProps = {
	title: string;
	subtitle?: string;
	children: ReactNode;
};

/**
 * The frame every component gallery sits in.
 *
 * The title and subtitle ride on the back button rather than heading the
 * content. They stay put while the body scrolls, they share the control's tap
 * target — the whole "‹ Button / Pressed 3 times" block goes back — and the
 * gallery's first row starts at the top of the viewport instead of below a
 * heading that repeats what the row the user just tapped already said.
 *
 * Deliberately a `Screen.ScrollArea` rather than a static body: it exercises
 * the tap-versus-scroll gesture conflict, which is the thing most likely to
 * break in a component built on the Gesture API.
 *
 * Carries no safe-area arithmetic of its own. The navbar publishes its measured
 * height into the screen context and the scroll area reserves exactly that, so
 * the notch and the home indicator are handled without this file naming either.
 *
 * The stacked pair is `min-w-0 flex-1` so a long title truncates to one line
 * rather than pushing the row wider than the bar.
 *
 * The back control is wired to expo-router here — the library takes no
 * navigation dependency, so the router stays in the app.
 */
export function GalleryScreen({ title, subtitle, children }: GalleryScreenProps): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>{title}</Screen.Navbar.Title>
						{subtitle ? <Screen.Navbar.Subtitle>{subtitle}</Screen.Navbar.Subtitle> : null}
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>
			<Screen.ScrollArea contentContainerClassName="gap-8">{children}</Screen.ScrollArea>
		</Screen>
	);
}
