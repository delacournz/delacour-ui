import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconColorSwatch } from "@delacour/native-ui/icons/central";
import { usePathname, useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The routes this must not float over.
 *
 * `/preview` is what `bun run previews` deep-links to for every demo in both
 * themes, so anything floating over the app lands in every published media
 * file. `/theme` is the screen this pushes — a button that pushes the screen
 * you are already on stacks duplicate cards behind you.
 *
 * The gate is a pathname check rather than a prop because this mounts once in
 * `_layout.tsx`, above the `Stack` that owns the route.
 */
const CAPTURE_ROUTE = "/preview";
const CUSTOMIZER_ROUTE = "/theme";

/**
 * The way to the design-system customizer, from anywhere.
 *
 * All that is left of the old floating customizer: the sheet it used to open is
 * a screen now. Keeping the trigger — rather than putting a row on the index —
 * is what preserves the thing the floating design was for: a look is worth
 * judging while looking at the component you care about, and this keeps that to
 * one tap from any of the thirty-four galleries. The cost the screen introduces
 * is a navigation; the cost it removes is a sheet that had to hold nine
 * decisions in two panes.
 *
 * `pb-safe` and friends are unavailable here — they need `Uniwind.updateInsets`
 * fed by a `SafeAreaListener`, which this app does not wire up — so the inset
 * comes from `react-native-safe-area-context` directly.
 */
export function ThemeTrigger(): ReactElement | null {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	if (pathname === CAPTURE_ROUTE || pathname.startsWith(CUSTOMIZER_ROUTE)) return null;

	return (
		<View className="absolute right-5 bottom-0 z-50" style={{ marginBottom: insets.bottom + 20 }}>
			<Button
				accessibilityLabel="Customize"
				haptic="selection"
				isIconOnly
				onPress={() => router.push("/theme")}
				testID="theme-trigger"
				variant="secondary"
			>
				<Icon icon={IconColorSwatch} />
			</Button>
		</View>
	);
}
ThemeTrigger.displayName = "Playground.ThemeTrigger";
