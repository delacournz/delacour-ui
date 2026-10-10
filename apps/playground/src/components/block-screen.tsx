import { Screen } from "@delacour/react-native-ui/screen";
import { useRouter } from "expo-router";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { ThemeToggle } from "@/components/theme-toggle";
import { LIST_GAP } from "@/tokens";

export type BlockScreenProps = {
	title: string;
	subtitle?: string;
	/** Lift the content over the keyboard — set on a screen with a field. */
	keyboardAware?: boolean;
	/** Pinned under the scroll area, e.g. a primary action. */
	footer?: ReactNode;
	children: ReactNode;
};

/**
 * The frame every block shares: a back button carrying the title, the theme
 * toggle, and a scroll area at the list gap.
 *
 * The blocks are compositions of the library, so the chrome is the library's
 * own `Screen` — the same one `GalleryScreen` uses — and a block adds nothing
 * to it but its content. A footer is optional and sticky, which is how a form's
 * action stays above the keyboard.
 */
export function BlockScreen({ title, subtitle, keyboardAware, footer, children }: BlockScreenProps): ReactElement {
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
			<Screen.ScrollArea contentContainerClassName={LIST_GAP} keyboardAware={keyboardAware}>
				{children}
			</Screen.ScrollArea>
			{footer ? <Screen.Footer sticky>{footer}</Screen.Footer> : null}
		</Screen>
	);
}
