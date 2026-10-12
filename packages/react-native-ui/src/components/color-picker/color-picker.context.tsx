import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { TextInputInstance } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable";
import type { ColorFormat, ColorPickerPresentation, Hsva, Rgba } from "./color-picker.types";
import type { ColorPickerSize, ColorPickerVariant } from "./color-picker.variants";

/** The picker's settled state — what `useColorPicker()` hands a custom part. */
export type ColorPickerState = {
	/** The settled model, on the JS thread. Lags the live drag by design — see `live`. */
	hsva: Hsva;
	rgba: Rgba;
	/** The settled value, in the picker's `format`. */
	value: string;
	/** `#rrggbb`, or `#rrggbbaa` below full opacity — whatever the `format`. */
	hex: string;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	hasAlpha: boolean;
	size: ColorPickerSize;
	variant: ColorPickerVariant;
	/**
	 * Writes a new colour from the JS thread. Fires `onValueChange`, and with
	 * `{ commit: true }` also `onValueCommit` — what a custom swatch or field calls.
	 */
	setHsva: (next: Hsva, options?: { commit?: boolean }) => void;
};

/** Everything the picker's own parts read. Internal: the public hook returns {@link ColorPickerState}. */
export type ColorPickerContextValue = ColorPickerState & {
	/**
	 * The live model, on the **UI thread**. Written by every drag, every frame;
	 * read by every animated thumb, preview and hue layer. React never sees a
	 * frame of it — the settled `hsva` catches up when the finger lifts.
	 */
	live: SharedValue<Hsva>;
	format: ColorFormat;
	haptic: false | HapticFeedback;
	presentation: ColorPickerPresentation;
	/** Whether a caller listens per frame. When nobody does, a drag never crosses to JS until it ends. */
	hasChangeListener: boolean;
	/** The sheet's open state. Always `false` inline. */
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	/** Called from a pan's `onBegin`: stops a controlled echo re-deriving the model mid-drag. */
	beginDrag: () => void;
	/** Called per frame from a pan, only when {@link hasChangeListener}. Fires `onValueChange` without a render. */
	dragChange: (next: Hsva) => void;
	/** Called from a pan's `onFinalize`: settles the model, commits and announces. */
	endDrag: (next: Hsva) => void;
	/** The hex field's input, so a `Field` row press can focus it. */
	inputRef: RefObject<TextInputInstance | null>;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

/**
 * Supplies one picker's state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./color-picker` and closing a cycle.
 */
export function ColorPickerProvider({
	value,
	children,
}: {
	value: ColorPickerContextValue;
	children: ReactNode;
}): ReactElement {
	return <ColorPickerContext value={value}>{children}</ColorPickerContext>;
}
ColorPickerProvider.displayName = "DelacourUI.ColorPicker.Provider";

/** The enclosing picker's state, or null outside a `<ColorPicker>`. */
export function useColorPickerContext(): ColorPickerContextValue | null {
	return use(ColorPickerContext);
}

/**
 * Reads the enclosing picker's settled state.
 *
 * For a custom swatch, readout or field that has to match the picker it sits in.
 * Throws outside one.
 */
export function useColorPicker(): ColorPickerState {
	const context = useColorPickerContext();
	if (!context) {
		throw new Error("useColorPicker must be called inside a <ColorPicker>.");
	}
	return context;
}

/**
 * The enclosing picker's full context, for a compound part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. Its error names the part rather than the hook.
 */
export function useColorPickerPart(component: string): ColorPickerContextValue {
	const context = useColorPickerContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <ColorPicker>.`);
	}
	return context;
}
