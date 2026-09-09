import { Button } from "delacour-react-native-ui/button";
import { Icon } from "delacour-react-native-ui/icon";
import { IconColorSwatch } from "delacour-react-native-ui/icons/central";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";

/**
 * The way to the design-system customiser: a navbar action, beside `ThemeToggle`.
 *
 * It floated over every screen once, in the bottom-right corner, and that
 * corner is where a `screen/*` demo draws its footer — so on the eight routes
 * whose whole point is the footer, the trigger sat on top of the thing being
 * shown. A floating control is also nothing the platform has: it is a web
 * pattern, and every other control in this app is a native one.
 *
 * So it is a navbar action now, and only on the screens that navigate rather
 * than demonstrate — the home screen and the folder indexes. A gallery's
 * navbar keeps `ThemeToggle` alone: the customiser is one back-swipe away from
 * every gallery, and a look is still judged against the component you care
 * about because a change on `/theme` repaints everything behind it.
 *
 * `icon-md` for the same reason `ThemeToggle` is: 44pt is the platform's
 * minimum target, and the navbar row has the room.
 *
 * `/theme` and `/preview` need no gate any more. The old pathname check
 * existed because the button was mounted once above the `Stack`; mounted per
 * screen, it is simply not on the screens it must not be on.
 */
export function ThemeTrigger(): ReactElement {
	const router = useRouter();

	return (
		<Button
			accessibilityHint="Opens the design-system customiser"
			accessibilityLabel="Customise"
			haptic="selection"
			onPress={() => router.push("/theme")}
			size="icon-md"
			testID="theme-trigger"
			variant="ghost"
		>
			<Icon icon={IconColorSwatch} />
		</Button>
	);
}
ThemeTrigger.displayName = "Playground.ThemeTrigger";
