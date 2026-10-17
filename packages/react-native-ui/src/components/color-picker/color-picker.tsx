import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, type TextInput, View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import type { HapticFeedback } from "../pressable";
import { formatColor, hsvToRgb, normalizeHsva, parseColor, resolveIncomingColor } from "./color-picker.color";
import { type ColorPickerContextValue, ColorPickerProvider } from "./color-picker.context";
import type { ColorFormat, ColorPickerPresentation, Hsva } from "./color-picker.types";
import {
	COLOR_PICKER_DEFAULT_VALUE,
	type ColorPickerSize,
	type ColorPickerVariant,
	colorPickerVariants,
	resolveColorPickerAxes,
} from "./color-picker.variants";
import { ColorPickerAlpha } from "./color-picker-alpha";
import { ColorPickerArea } from "./color-picker-area";
import { ColorPickerContent } from "./color-picker-content";
import { ColorPickerHue } from "./color-picker-hue";
import { ColorPickerInput } from "./color-picker-input";
import { ColorPickerPreview } from "./color-picker-preview";
import { ColorPickerSheet } from "./color-picker-sheet";
import { ColorPickerSwatch } from "./color-picker-swatch";
import { ColorPickerSwatches } from "./color-picker-swatches";
import { ColorPickerTrigger } from "./color-picker-trigger";

export type ColorPickerProps = Omit<ViewProps, "children"> & {
	/** Controlled colour, in any notation the picker accepts. Reported back in `format`. */
	value?: string;
	/** Starting colour while uncontrolled. Defaults to `#000000`. */
	defaultValue?: string;
	/** Fires on every frame of a drag, and on every other change. */
	onValueChange?: (value: string) => void;
	/** Fires once a change is settled: a drag released, a field submitted, a swatch tapped. */
	onValueCommit?: (value: string) => void;
	/** The notation reported. `hex` is `#rrggbb`, or `#rrggbbaa` below full opacity. */
	format?: ColorFormat;
	/** Shows `ColorPicker.Alpha` and lets the alpha move. Off, alpha is pinned at one. */
	hasAlpha?: boolean;
	size?: ColorPickerSize;
	/** The trigger row's and the hex field's box. Never the gradients. */
	variant?: ColorPickerVariant;
	/** Blocks every input path and fades the picker. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Reports an invalid value on the trigger and the field. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** Renders the colour but ignores every drag, tap and keystroke. */
	isReadOnly?: boolean;
	/** Played as a drag begins; a light tick follows on release. `false` silences both. */
	haptic?: false | HapticFeedback;
	/** On the page, or in a `BottomSheet` behind `ColorPicker.Trigger`. */
	presentation?: ColorPickerPresentation;
	/** Controlled sheet state. Ignored inline. */
	isOpen?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	className?: string;
	/** The parts. Omitted, the picker renders its default anatomy. */
	children?: ReactNode;
};

/** The model a string starts the picker on — the default colour when it does not parse. */
function initialHsva(value: string, hasAlpha: boolean): Hsva {
	const parsed = parseColor(value) ?? parseColor(COLOR_PICKER_DEFAULT_VALUE) ?? { h: 0, s: 0, v: 0, a: 1 };
	return normalizeHsva(parsed, hasAlpha);
}

function ColorPickerRoot({
	value,
	defaultValue = COLOR_PICKER_DEFAULT_VALUE,
	onValueChange,
	onValueCommit,
	format = "hex",
	hasAlpha = false,
	size,
	variant,
	isDisabled,
	isInvalid,
	isReadOnly,
	haptic = "selection",
	presentation = "inline",
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	className,
	children,
	...props
}: ColorPickerProps): ReactElement {
	const field = useFieldContext();
	const axes = resolveColorPickerAxes({ field, own: { isDisabled, isInvalid, isReadOnly, size, variant } });
	const slots = colorPickerVariants({ isDisabled: axes.isDisabled, size: axes.size });

	const [hsva, setSettled] = useState<Hsva>(() => initialHsva(value ?? defaultValue, hasAlpha));
	const live = useSharedValue<Hsva>(hsva);
	const inputRef = useRef<TextInput | null>(null);

	// A ref rather than state: the pan flips it at both ends of every drag, and
	// nothing renders differently for it.
	const isDragging = useRef(false);
	const hsvaRef = useRef(hsva);
	hsvaRef.current = hsva;

	// The controlled resync. A value that is the picker's own echo — or that does
	// not parse — is ignored, so a parent that stores what `onValueChange` hands
	// it never re-derives the model mid-drag and never snaps a grey's hue to red.
	useEffect(() => {
		if (value === undefined || isDragging.current) return;
		const next = resolveIncomingColor(value, hsvaRef.current, format, hasAlpha);
		if (!next) return;
		setSettled(next);
		live.value = next;
	}, [format, hasAlpha, live, value]);

	const emit = useCallback((next: Hsva) => formatColor(next, format), [format]);

	const settle = useCallback(
		(next: Hsva, commit: boolean) => {
			const normalized = normalizeHsva(next, hasAlpha);
			setSettled(normalized);
			live.value = normalized;
			const formatted = emit(normalized);
			onValueChange?.(formatted);
			if (!commit) return;
			onValueCommit?.(formatted);
			AccessibilityInfo.announceForAccessibility(formatted);
		},
		[emit, hasAlpha, live, onValueChange, onValueCommit]
	);

	const setHsva = useCallback(
		(next: Hsva, options?: { commit?: boolean }) => settle(next, options?.commit ?? false),
		[settle]
	);

	const beginDrag = useCallback(() => {
		isDragging.current = true;
	}, []);

	const dragChange = useCallback(
		(next: Hsva) => {
			onValueChange?.(emit(normalizeHsva(next, hasAlpha)));
		},
		[emit, hasAlpha, onValueChange]
	);

	const endDrag = useCallback(
		(next: Hsva) => {
			isDragging.current = false;
			settle(next, true);
		},
		[settle]
	);

	const [isOpenState, setOpenState] = useControllableState({
		defaultValue: defaultOpen,
		onChange: onOpenChange,
		value: isOpenProp,
	});
	const isOpen = presentation === "sheet" && isOpenState;
	const isInteractive = !axes.isDisabled && !axes.isReadOnly;

	const setOpen = useCallback(
		(next: boolean) => {
			if (next && !isInteractive) return;
			setOpenState(next);
		},
		[isInteractive, setOpenState]
	);

	// Offered to an enclosing `Field`, so tapping the label opens the sheet, or
	// focuses the hex field inline. A ref-backed trampoline, as `Switch` does it,
	// so the field is not re-registered on every change.
	const pressRef = useRef<() => void>(() => undefined);
	pressRef.current = () => {
		if (!isInteractive) return;
		if (presentation === "sheet") setOpen(true);
		else inputRef.current?.focus();
	};
	const registerPress = field?.registerPress;
	const stablePress = useCallback(() => pressRef.current(), []);
	useEffect(() => {
		if (!registerPress) return;
		registerPress(stablePress);
		return () => registerPress(null);
	}, [registerPress, stablePress]);

	const context = useMemo<ColorPickerContextValue>(
		() => ({
			beginDrag,
			dragChange,
			endDrag,
			format,
			hasAlpha,
			hasChangeListener: onValueChange !== undefined,
			haptic,
			hex: formatColor(hsva, "hex"),
			hsva,
			inputRef,
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			isOpen,
			isReadOnly: axes.isReadOnly,
			live,
			presentation,
			rgba: hsvToRgb(hsva),
			setHsva,
			setOpen,
			size: axes.size,
			value: formatColor(hsva, format),
			variant: axes.variant,
		}),
		[
			axes.isDisabled,
			axes.isInvalid,
			axes.isReadOnly,
			axes.size,
			axes.variant,
			beginDrag,
			dragChange,
			endDrag,
			format,
			hasAlpha,
			haptic,
			hsva,
			isOpen,
			live,
			onValueChange,
			presentation,
			setHsva,
			setOpen,
		]
	);

	const body = children ?? <ColorPickerDefaultAnatomy presentation={presentation} />;

	// The sheet's root renders no view, so the trigger and the teleported surface
	// both sit inside the picker's own column and read one context.
	return (
		<ColorPickerProvider value={context}>
			<View className={slots.root({ className })} {...props}>
				{presentation === "sheet" ? (
					<ColorPickerSheet isOpen={isOpen} onOpenChange={setOpen}>
						{body}
					</ColorPickerSheet>
				) : (
					body
				)}
			</View>
		</ColorPickerProvider>
	);
}

/**
 * What `<ColorPicker />` with no children draws: the area, the hue track, the
 * alpha track when `hasAlpha`, and the hex field — behind a trigger row when it
 * presents in a sheet. A bare picker is a complete one.
 */
function ColorPickerDefaultAnatomy({ presentation }: { presentation: ColorPickerPresentation }): ReactElement {
	const surface = (
		<ColorPickerContent>
			<ColorPickerArea />
			<ColorPickerHue />
			<ColorPickerAlpha />
			<ColorPickerInput />
		</ColorPickerContent>
	);
	if (presentation === "inline") return surface;
	return (
		<>
			<ColorPickerTrigger />
			{surface}
		</>
	);
}
ColorPickerDefaultAnatomy.displayName = "DelacourUI.ColorPicker.DefaultAnatomy";

/**
 * Pick a colour by dragging: a saturation and brightness area, a hue track, an
 * optional opacity track, a hex field and preset swatches.
 *
 * Every drag runs on the UI thread. The area, the tracks, the thumbs and the
 * preview all read one shared value, so nothing re-renders while a finger
 * moves; JavaScript hears each frame only through `onValueChange`, and
 * `onValueCommit` fires once the change is settled.
 *
 * Inline by default. `presentation="sheet"` puts the surface in a `BottomSheet`
 * opened by `ColorPicker.Trigger` — mount `BottomSheetProvider` once in the app.
 * Inside a `Field` the picker takes its disabled and invalid states, reads its
 * label, and opens (or focuses its field) when the label is tapped.
 *
 * @example
 * <ColorPicker defaultValue="#f59e0b" onValueCommit={save} />
 *
 * @example
 * <Field>
 *   <Field.Label>Accent</Field.Label>
 *   <ColorPicker defaultValue="#f59e0b" hasAlpha presentation="sheet" onValueCommit={save}>
 *     <ColorPicker.Trigger />
 *     <ColorPicker.Content>
 *       <ColorPicker.Area />
 *       <ColorPicker.Hue />
 *       <ColorPicker.Alpha />
 *       <ColorPicker.Input />
 *       <ColorPicker.Swatches colors={PRESETS} />
 *     </ColorPicker.Content>
 *   </ColorPicker>
 * </Field>
 */
export const ColorPicker = Object.assign(ColorPickerRoot, {
	/** The row that opens the sheet: a preview, the hex and a chevron. Sheet presentation only. */
	Trigger: ColorPickerTrigger,
	/** The surface the parts sit on — a column inline, a `BottomSheet` panel in a sheet. */
	Content: ColorPickerContent,
	/** Saturation across, brightness down, over the current hue. */
	Area: ColorPickerArea,
	/** The hue track. */
	Hue: ColorPickerHue,
	/** The opacity track. Renders nothing without `hasAlpha`. */
	Alpha: ColorPickerAlpha,
	/** A swatch of the current colour over a checkerboard. */
	Preview: ColorPickerPreview,
	/** The hex field. Takes any accepted notation; commits on blur and submit. */
	Input: ColorPickerInput,
	/** A row of preset swatches. Renders a `Swatch` per colour unless given children. */
	Swatches: ColorPickerSwatches,
	/** One preset. Tap to set; ringed while it is the current colour. */
	Swatch: ColorPickerSwatch,
	displayName: "DelacourUI.ColorPicker",
});
