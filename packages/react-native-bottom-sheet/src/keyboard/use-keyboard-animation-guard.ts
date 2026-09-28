import { useCallback, useEffect } from "react";
import { TextInput } from "react-native";
import { useKeyboardContext } from "react-native-keyboard-controller";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { shouldResetKeyboardAnimation } from "../core";

/** The one pair of animation values `KeyboardProvider` shares with the whole app. */
export type KeyboardAnimationValues = {
	progress: SharedValue<number>;
	height: SharedValue<number>;
};

/**
 * Snaps `KeyboardProvider`'s shared progress and height back to closed when
 * they are provably stale.
 *
 * The focus check stays on the JS thread — React Native's focus registry
 * lives there, and it is the one signal keyboard-controller's own missed
 * notifications cannot poison — and the read-and-write happens inside one
 * worklet, so the decision is made against the UI thread's own values.
 * A snap, never an animation: the keyboard is already gone.
 */
export function reconcileKeyboardAnimation({ progress, height }: KeyboardAnimationValues): void {
	if (TextInput.State.currentlyFocusedInput() != null) return;

	scheduleOnUI(() => {
		"worklet";
		if (!shouldResetKeyboardAnimation({ hasFocusedInput: false, height: height.value, progress: progress.value })) {
			return;
		}
		progress.value = 0;
		height.value = 0;
	});
}

/**
 * Repairs a keyboard `KeyboardProvider` still believes is up.
 *
 * On iOS the provider's shared values are written by `keyboardWillShow` /
 * `keyboardWillHide` alone, so any teardown that produces no `willHide` — a
 * native-stack pop over a focused field, an interrupted interactive dismiss,
 * an app suspend — leaves them pinned open, app-wide. A sheet mounted into
 * that state would lift for a keyboard that is not there.
 *
 * Idempotent and cheap: a no-op whenever a field is genuinely focused. The
 * sheet runs it every time its portal presents; a screen of your own can run
 * it on mount the same way. The same decision as
 * `@delacour/react-native-ui`'s `useKeyboardAnimationGuard`, over the same
 * core function, so the two never disagree about what stale means.
 */
export function useKeyboardAnimationGuard(): void {
	const { reanimated } = useKeyboardContext();
	const reconcile = useCallback(() => reconcileKeyboardAnimation(reanimated), [reanimated]);

	useEffect(() => {
		reconcile();
	}, [reconcile]);
}
