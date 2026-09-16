import { Screen } from "@delacour/native-ui/screen";
import { useRouter } from "expo-router";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { ThemeToggle } from "@/components/theme-toggle";

export type GalleryScreenProps = {
	title: string;
	subtitle?: string;
	/**
	 * Scroll the focused field clear of the keyboard.
	 *
	 * Off by default, because it is only ever the right answer for a gallery
	 * that holds a text field, and `Screen.ScrollArea` is the one that knows how
	 * to do it — this only forwards the prop under the name it already has.
	 */
	keyboardAware?: boolean;
	children: ReactNode;
};

/**
 * A scrolling frame for a hand-written page.
 *
 * **No longer what a component gallery uses.** Galleries are paged now — one
 * demo per screen, through `DemoPager` — and this is what remains for a page
 * that genuinely has to be written by hand and still wants the gallery's
 * chrome. `delacour-mark.tsx` is the one that does.
 *
 * The title and subtitle ride on the back button rather than heading the
 * content. They stay put while the body scrolls, they share the control's tap
 * target — the whole "‹ Button / Pressed 3 times" block goes back — and the
 * content starts at the top of the viewport instead of below a heading that
 * repeats what the row the user just tapped already said.
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
 *
 * Carries `ThemeToggle` in the navbar's action slot, the same as `DemoPager`.
 * A hand-written page is still a page someone is looking at a component on, and
 * a gallery whose chrome flipped the theme beside one that did not would read
 * as a bug in whichever you reached second.
 */
export function GalleryScreen({ title, subtitle, keyboardAware, children }: GalleryScreenProps): ReactElement {
	const router = useRouter();

	return (
		<Screen>
			<Screen.Navbar actions={<ThemeToggle />}>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>{title}</Screen.Navbar.Title>
						{subtitle ? <Screen.Navbar.Subtitle>{subtitle}</Screen.Navbar.Subtitle> : null}
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>
			<Screen.ScrollArea contentContainerClassName="gap-8" keyboardAware={keyboardAware}>
				{children}
			</Screen.ScrollArea>
		</Screen>
	);
}
