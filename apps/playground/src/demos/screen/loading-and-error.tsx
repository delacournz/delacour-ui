import { Button } from "delacour-react-native-ui/button";
import { Screen } from "delacour-react-native-ui/screen";
import { type ReactElement, useEffect, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Loading and error",
	caption:
		"The two whole-screen states a route returns instead of its content. Both keep the navbar by default, so the frame does not jump when the real content replaces them and a user is never stranded on a screen they cannot leave — `showNavbar={false}` drops it for a root screen with nowhere to go back to.",
	note: "Press *Try again*. Each is a whole `Screen`, so nothing below has to re-mount into a different frame when the data finally arrives.",
	capture: { frame: "device" },
};

/** How long the retry spins before failing again. */
const RETRY_MS = 1400;

/**
 * `Screen.Loading` and `Screen.Error`, returned in place of a route's content.
 *
 * Neither takes an `onBack` here: this is a root screen, and omitting the
 * handler renders the navbar without a back control rather than dropping the
 * bar — which is what keeps the frame from shifting between the three states.
 *
 * Nesting either inside another `Screen` is safe too. The provider passes the
 * outer context through rather than shadowing it.
 */
export function Demo(): ReactElement {
	const [isLoading, setLoading] = useState(false);

	useEffect(() => {
		if (!isLoading) return;
		const timer = setTimeout(() => setLoading(false), RETRY_MS);
		return () => clearTimeout(timer);
	}, [isLoading]);

	if (isLoading) return <Screen.Loading title="Inbox" />;

	return (
		<Screen.Error message="The request timed out before the server answered. Check your connection and try again.">
			<Button haptic="medium" onPress={() => setLoading(true)} size="sm" testID="try-again">
				Try again
			</Button>
		</Screen.Error>
	);
}
