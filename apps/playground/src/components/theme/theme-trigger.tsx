import { Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconColorSwatch } from "delacour-react-native-ui/icons/central";
import { usePathname, useRouter } from "expo-router";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The two routes this must not float over.
 *
 * `/preview` is what `bun run previews` deep-links to for every demo in both
 * themes. Anything floating over the app at capture time is baked into all 120
 * published media files and shipped on the documentation site, so this gate is
 * not a preference — without it a capture run poisons `apps/web/public/previews/**`.
 *
 * `/theme` is the screen this pushes: a button that pushes the screen you are
 * already on stacks duplicate cards behind you.
 *
 * The gate is a pathname check rather than a prop because this mounts once in
 * `_layout.tsx`, above the `Stack` that owns the route.
 */
const CAPTURE_ROUTE = "/preview";
const CUSTOMIZER_ROUTE = "/theme";

/**
 * The gap between the button and the safe area, in points.
 *
 * Not in `src/tokens.ts`: that file holds the literals several files shared and
 * kept drifting apart, and this one has exactly one reader.
 */
const FLOAT_GAP = 20;

/**
 * The way to the design-system customiser, from anywhere.
 *
 * It floats deliberately. Reaching the customiser from the screen you are
 * looking at is the whole point of the playground — a look is worth judging
 * against the component you care about, and a navbar action only on the
 * screens that navigate put the customiser two taps and a context switch away
 * from the thirty-four galleries where the judging actually happens.
 *
 * **The known cost, accepted:** the bottom-right corner is also where a
 * `screen/*` demo draws its footer, so on those eight routes this sits over the
 * thing being demonstrated. That is the trade — every screen reaches the
 * customiser, and eight of them are partly covered while it does.
 *
 * `pb-safe` and friends are unavailable here — they need `Uniwind.updateInsets`
 * fed by a `SafeAreaListener`, which this app does not wire up — so the inset
 * comes from `react-native-safe-area-context` directly.
 *
 * `icon-lg` rather than the navbar's `icon-md`: floating over content, it has
 * no row to sit in and no neighbours to match, and it is the one control on
 * screen that has to be findable without being looked for.
 */
export function ThemeTrigger(): ReactElement | null {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	if (pathname === CAPTURE_ROUTE || pathname.startsWith(CUSTOMIZER_ROUTE)) return null;

	return (
		<View className="absolute right-5 bottom-0 z-50" style={{ marginBottom: insets.bottom + FLOAT_GAP }}>
			<Button
				accessibilityHint="Opens the design-system customiser"
				accessibilityLabel="Customise"
				haptic="selection"
				onPress={() => router.push("/theme")}
				size="icon-lg"
				testID="theme-trigger"
				variant="secondary"
			>
				<Icon icon={IconColorSwatch} />
			</Button>
		</View>
	);
}
ThemeTrigger.displayName = "Playground.ThemeTrigger";
