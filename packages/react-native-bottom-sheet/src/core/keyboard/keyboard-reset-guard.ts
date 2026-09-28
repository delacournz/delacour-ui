export type KeyboardAnimationState = {
	/** `KeyboardProvider`'s shared progress, 0 closed through 1 open. */
	progress: number;
	/** `KeyboardProvider`'s shared height, negative while open. */
	height: number;
	/** Whether React Native's focus registry holds a focused `TextInput`. */
	hasFocusedInput: boolean;
};

/**
 * Whether `KeyboardProvider`'s shared animation values are provably stale.
 *
 * A port of `@delacour/react-native-ui`'s `shouldResetKeyboardAnimation`, so
 * the engine's `useKeyboardAnimationGuard` and the wrapper's `Screen.Footer`
 * guard agree on what stale means. keyboard-controller can be left holding an
 * open keyboard after a dismiss its notifications never reported — a modal
 * closing over a focused input is the classic — and the sheet would then lift
 * for a keyboard that is not there.
 *
 * `hasFocusedInput` MUST come from React Native's own focus registry
 * (`TextInput.State.currentlyFocusedInput()`), never from
 * `KeyboardController.isVisible()`. The latter is fed by the very
 * `keyboardWillShow` / `keyboardDidHide` notifications that go missing in the
 * failure this guard exists for, so in the broken case it reads a stale `true`
 * and would veto the repair. RN's registry is driven by the input's own native
 * focus and blur — a genuinely independent signal.
 */
export function shouldResetKeyboardAnimation(state: KeyboardAnimationState): boolean {
	"worklet";
	// Never fight a real, focused keyboard.
	if (state.hasFocusedInput) return false;
	return state.progress !== 0 || state.height !== 0;
}
