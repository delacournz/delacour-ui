import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { type RefCallback, useCallback, useRef } from "react";
import { type BlurEvent, type FocusEvent, findNodeHandle, TextInput } from "react-native";

/**
 * `findNodeHandle` for a value React Native's own types do not admit.
 *
 * `TextInput.State.currentlyFocusedInput()` returns a Fabric host instance, and
 * the shipped signature still describes the pre-Fabric parameter — the runtime
 * accepts it, which is what gorhom's own `BottomSheetTextInput` relies on. One
 * cast, in one place, rather than at each call.
 */
function nodeHandleOf(instance: unknown): number | null {
	return findNodeHandle(instance as Parameters<typeof findNodeHandle>[0]);
}

export type BottomSheetInputHandlers = {
	onFocus: (event: FocusEvent) => void;
	onBlur: (event: BlurEvent) => void;
	ref: RefCallback<TextInput | null>;
};

/**
 * Makes this package's `Input` behave like a text field the sheet owns.
 *
 * Spread the result onto any `TextInput` inside a `BottomSheet`:
 *
 * ```tsx
 * <Input {...useBottomSheetInput()} placeholder="Name" />
 * ```
 *
 * A sheet only knows to grow for the keyboard when it knows the focused field is
 * one of its own. gorhom ships `BottomSheetTextInput` to register that, but
 * reaching for it here would mean this library's `Input` — its variants, its
 * `Input.Group`, its invalid and disabled cascade — could not be used inside a
 * sheet at all. So the registration is exposed as handlers instead, and `Input`
 * keeps knowing nothing about `@gorhom/bottom-sheet`.
 *
 * Three props, and all three are load-bearing:
 *
 * - `ref` registers the field's native node with the sheet. Without it, moving
 *   focus from one field in the sheet to the next reads as the keyboard closing
 *   and reopening, and the sheet resizes twice on the way.
 * - `onFocus` tells the sheet which field to keep clear of the keyboard.
 * - `onBlur` gives that up again, unless focus went to another field in the same
 *   sheet.
 *
 * Called outside a sheet it returns inert handlers rather than throwing, so a
 * form component shared between a screen and a sheet needs no branch.
 *
 * It covers the keyboard half only. A *drag* across a field can still be claimed
 * by the sheet's content pan, because gorhom's input is built on Gesture
 * Handler's `TextInput` and this one is not; if that ever bites, the fix is
 * `enableContentPanningGesture={false}` on the `BottomSheet.Container`. The
 * *tap* half — a scrim that used to swallow the press meant for the field — is
 * solved in `BottomSheet.Overlay`, not here.
 *
 * @example
 * <Field>
 *   <Field.Label>Name</Field.Label>
 *   <Input {...useBottomSheetInput()} onChangeText={setName} value={name} />
 * </Field>
 */
export function useBottomSheetInput(): BottomSheetInputHandlers {
	const internal = useBottomSheetInternal(true);
	// The node this field last registered, so the ref can withdraw exactly it.
	// A JS ref rather than a shared value: nothing renders differently for it.
	const registeredNodeRef = useRef<number | null>(null);

	const ref = useCallback<RefCallback<TextInput | null>>(
		(instance) => {
			const nodes = internal?.textInputNodesRef.current;
			const previous = registeredNodeRef.current;

			if (previous !== null) {
				nodes?.delete(previous);
				registeredNodeRef.current = null;
				if (internal !== null && internal.animatedKeyboardState.get().target === previous) {
					internal.animatedKeyboardState.set((state) => ({ ...state, target: undefined }));
				}
			}

			if (instance === null || nodes === undefined) return;

			const node = nodeHandleOf(instance);
			if (node === null) return;

			nodes.add(node);
			registeredNodeRef.current = node;
		},
		[internal]
	);

	const onFocus = useCallback(
		(event: FocusEvent) => {
			if (internal === null) return;
			const target = event.nativeEvent.target;
			internal.animatedKeyboardState.set((state) => ({ ...state, target }));
		},
		[internal]
	);

	const onBlur = useCallback(
		(event: BlurEvent) => {
			if (internal === null) return;

			const target = event.nativeEvent.target;
			const isThisFieldsTarget = internal.animatedKeyboardState.get().target === target;
			if (!isThisFieldsTarget) return;

			// React Native's own focus registry, not the sheet's: focus may already
			// have moved to the next field in the same sheet, and giving the target
			// up there would close and reopen the sheet's keyboard allowance between
			// two taps that never dismissed the keyboard.
			const focused = TextInput.State.currentlyFocusedInput();
			const focusedNode = focused === null ? null : nodeHandleOf(focused);
			if (focusedNode !== null && internal.textInputNodesRef.current.has(focusedNode)) return;

			internal.animatedKeyboardState.set((state) => ({ ...state, target: undefined }));
		},
		[internal]
	);

	return { onBlur, onFocus, ref };
}
