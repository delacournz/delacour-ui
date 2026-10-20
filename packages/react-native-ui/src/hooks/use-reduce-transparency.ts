import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Whether the user has asked the system for less transparency — iOS's
 * Settings > Accessibility > Display & Text Size > Reduce Transparency.
 *
 * A blur behind text is the thing that setting exists to remove, so a
 * component drawing one swaps it for an opaque wash while this is true. It
 * follows the setting live: the listener re-renders when it is toggled with the
 * app open.
 *
 * Starts `false` and settles on the first read, so a blur may paint for one
 * frame before the wash replaces it. Android has no such setting and always
 * resolves `false`.
 */
export function useReduceTransparency(): boolean {
	const [isEnabled, setIsEnabled] = useState(false);

	useEffect(() => {
		let isMounted = true;
		AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
			if (isMounted) setIsEnabled(value);
		});
		const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setIsEnabled);

		return () => {
			isMounted = false;
			subscription.remove();
		};
	}, []);

	return isEnabled;
}
