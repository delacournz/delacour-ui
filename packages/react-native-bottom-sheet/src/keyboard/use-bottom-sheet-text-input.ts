import { type ComponentRef, type RefCallback, useCallback, useRef } from "react";
import { findNodeHandle, TextInput } from "react-native";
import { useOptionalBottomSheetInternal } from "../components/bottom-sheet.context";

/**
 * `findNodeHandle` for a value React Native's own types do not admit.
 *
 * `TextInput.State.currentlyFocusedInput()` returns a Fabric host instance and
 * the shipped signature still describes the pre-Fabric parameter; the runtime
 * accepts it. One cast, in one place.
 */
function nodeHandleOf(instance: unknown): number | null {
	return findNodeHandle(instance as Parameters<typeof findNodeHandle>[0]) ?? null;
}

export type BottomSheetTextInputHandlers = {
	ref: RefCallback<ComponentRef<typeof TextInput> | null>;
	onFocus: () => void;
	onBlur: () => void;
};

/**
 * Registers a text field as the sheet's own, so the keyboard it raises is the
 * sheet's to lift for whatever `keyboardScope` says.
 *
 * Spread the result onto any `TextInput` — yours, a skin's, a library's:
 *
 * ```tsx
 * <TextInput {...useBottomSheetTextInput()} placeholder="Name" />
 * ```
 *
 * `BottomSheet.TextInput` is this over React Native's `TextInput`, for the
 * plain case. All three handlers matter: `ref` puts the field's native node
 * in the sheet's registry, `onFocus` claims the keyboard, and `onBlur` gives
 * it up — unless focus moved to another registered field in the same sheet,
 * which React Native's own focus registry already knows. Without that check
 * a tap from one field to the next would read as the keyboard closing and
 * reopening, and the sheet would resize twice between two taps that never
 * dismissed it.
 *
 * Outside a sheet the handlers are inert, so a form shared between a screen
 * and a sheet needs no branch.
 */
export function useBottomSheetTextInput(): BottomSheetTextInputHandlers {
	const registry = useOptionalBottomSheetInternal()?.keyboard ?? null;
	const registered = useRef<number | null>(null);

	const ref = useCallback<RefCallback<ComponentRef<typeof TextInput> | null>>(
		(instance) => {
			if (registry === null) return;
			const previous = registered.current;
			if (previous !== null) {
				registry.nodes.current.delete(previous);
				registered.current = null;
			}
			if (instance === null) return;
			const node = nodeHandleOf(instance);
			if (node === null) return;
			registry.nodes.current.add(node);
			registered.current = node;
		},
		[registry]
	);

	const onFocus = useCallback(() => {
		if (registry === null) return;
		registry.focused.value = true;
	}, [registry]);

	const onBlur = useCallback(() => {
		if (registry === null) return;
		const focused = TextInput.State.currentlyFocusedInput();
		const node = focused == null ? null : nodeHandleOf(focused);
		if (node !== null && registry.nodes.current.has(node)) return;
		registry.focused.value = false;
	}, [registry]);

	return { ref, onFocus, onBlur };
}
