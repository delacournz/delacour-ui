import { type ComponentRef, type ReactElement, useCallback, useMemo } from "react";
import { type BlurEvent, type FocusEvent, TextInput } from "react-native";
import { useBottomSheetTextInput } from "../keyboard/use-bottom-sheet-text-input";
import { composeRefs } from "../lib/compose-refs";
import type { BottomSheetTextInputProps } from "./bottom-sheet.types";

/**
 * React Native's `TextInput`, registered with the sheet.
 *
 * `useBottomSheetTextInput` over a plain `TextInput`, for the case with no
 * skin in front of it: the keyboard it raises is the sheet's under any
 * `keyboardScope`, including `registered`. A field of your own takes the
 * hook instead and keeps its component.
 */
export function BottomSheetTextInput({ ref, onFocus, onBlur, ...props }: BottomSheetTextInputProps): ReactElement {
	const handlers = useBottomSheetTextInput();
	const composed = useMemo(
		() => composeRefs<ComponentRef<typeof TextInput> | null>(ref, handlers.ref),
		[ref, handlers.ref]
	);

	const handleFocus = useCallback(
		(event: FocusEvent) => {
			handlers.onFocus();
			onFocus?.(event);
		},
		[handlers.onFocus, onFocus]
	);
	const handleBlur = useCallback(
		(event: BlurEvent) => {
			handlers.onBlur();
			onBlur?.(event);
		},
		[handlers.onBlur, onBlur]
	);

	return <TextInput onBlur={handleBlur} onFocus={handleFocus} ref={composed} {...props} />;
}
BottomSheetTextInput.displayName = "DelacourBottomSheet.BottomSheet.TextInput";
