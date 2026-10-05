import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import { describeHue } from "./color-picker.color";
import type { Hsva } from "./color-picker.types";

/** Input's three steps, so a hex field and a trigger row sit level with every other field. */
export const COLOR_PICKER_SIZES = ["sm", "md", "lg"] as const;

/** Input's two box treatments. They reach the trigger row and the hex field, never the gradients. */
export const COLOR_PICKER_VARIANTS = ["primary", "secondary"] as const;

export type ColorPickerSize = (typeof COLOR_PICKER_SIZES)[number];
export type ColorPickerVariant = (typeof COLOR_PICKER_VARIANTS)[number];

export const COLOR_PICKER_DEFAULT_SIZE: ColorPickerSize = "md";
export const COLOR_PICKER_DEFAULT_VARIANT: ColorPickerVariant = "primary";

/** What an uncontrolled picker starts on when given nothing. */
export const COLOR_PICKER_DEFAULT_VALUE = "#000000";

/** What one assistive step moves saturation, brightness or opacity by. */
export const COLOR_PICKER_STEP = 0.05;

/** What one assistive step moves the hue by, in degrees. Thirty-six swipes round the wheel. */
export const COLOR_PICKER_HUE_STEP = 10;

/** The area's height in points, per size. Restated from the `h-*` class and pinned to it by a test. */
export const COLOR_PICKER_AREA_HEIGHT_PT: Record<ColorPickerSize, number> = { sm: 160, md: 200, lg: 240 };

/** A swatch's and the preview's edge in points, per size. Pinned to the `size-*` class by a test. */
export const COLOR_PICKER_SWATCH_EDGE_PT: Record<ColorPickerSize, number> = { sm: 24, md: 32, lg: 40 };

/**
 * The two tokens the transparency checkerboard alternates between.
 *
 * Semantic, so the squares follow the theme: a checkerboard drawn in fixed
 * white and grey glares out of a dark screen.
 */
export const COLOR_PICKER_CHECKERBOARD_TOKENS = ["background", "muted"] as const;

/** The checkerboard's square, in points. */
export const COLOR_PICKER_CHECKER_SIZE = 6;

/** The thumb's scale at rest and while a finger holds it. */
export const COLOR_PICKER_THUMB_ANIMATION = { restScale: 1, grabbedScale: 1.15 } as const;

/** The spring the grab scale rides — Slider's, so two handles side by side move alike. */
export const COLOR_PICKER_THUMB_SPRING = { damping: 18, mass: 0.4, stiffness: 320 } as const;

/** How long a swatch's selection ring takes to fade in, in milliseconds. */
export const COLOR_PICKER_RING_FADE_MS = 160;

/**
 * Styling for every part of a colour picker.
 *
 * One slotted `tv()` so `size` is declared once across the area, both tracks,
 * the thumbs and the swatches. No slot carries a colour the picker is *showing*
 * — those are painted by animated styles and SVG, because a class is resolved
 * at render and the colour moves every frame of a drag.
 *
 * **The thumb's ring is two semantic borders, never a raw white.** `border-background`
 * outside and a `border-foreground` hairline inside, which reads on any hue in
 * either theme: light on dark colours, dark on light ones, and both at once on
 * the yellows where a single white ring disappears.
 *
 * **A track and its touch padding sum to 44pt at every size**, Slider's rule and
 * for Slider's reason: they are one number, so they live in one cell.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const colorPickerVariants = tv({
	slots: {
		root: "w-full gap-3",
		/** The inline surface: the column the area, tracks and field stack in. */
		content: "w-full gap-3",
		/** The saturation and brightness square. Positions its thumb. */
		area: "relative w-full",
		/** The clipped layer the area's gradients are drawn in, under the thumb. */
		areaSurface: "absolute inset-0 overflow-hidden rounded-lg border border-border",
		/** The transparent box a track's drag is claimed on. Padded on the cross axis only. */
		touchArea: "w-full justify-center",
		/** A hue or alpha track. Centres its thumb on the cross axis. */
		track: "relative w-full justify-center",
		/** The clipped layer a track's gradient is drawn in, under the thumb. */
		trackSurface: "absolute inset-0 overflow-hidden rounded-full border border-border",
		/** The ring. Its position and scale are one animated transform. */
		thumb: "absolute left-0 rounded-full border-2 border-background",
		/** The hairline inside the ring, and the current colour inside that. */
		thumbInner: "flex-1 overflow-hidden rounded-full border border-foreground",
		/** The current colour, over a checkerboard. */
		preview: "overflow-hidden rounded-md border border-border",
		swatches: "flex-row flex-wrap gap-2",
		/** A preset. The ring is the border; the colour is inset from it. */
		swatch: "rounded-full border-2 p-0.5",
		swatchFill: "flex-1 overflow-hidden rounded-full border border-border",
		/** The row the sheet's trigger draws — the field box comes from Input's own resolver. */
		trigger: "",
		triggerLabel: "flex-1 font-sans text-foreground",
		/** The hex field's width; the box itself is Input's. */
		input: "w-full",
	},
	variants: {
		size: {
			sm: {
				area: "h-40",
				touchArea: "py-3.5",
				track: "h-4",
				thumb: "size-5",
				preview: "size-6",
				swatch: "size-6",
				triggerLabel: "text-input-sm",
			},
			md: {
				area: "h-50",
				touchArea: "py-3",
				track: "h-5",
				thumb: "size-6",
				preview: "size-8",
				swatch: "size-8",
				triggerLabel: "text-input-md",
			},
			lg: {
				area: "h-60",
				touchArea: "py-2.5",
				track: "h-6",
				thumb: "size-7",
				preview: "size-10",
				swatch: "size-10",
				triggerLabel: "text-input-lg",
			},
		},
		// Declared so `tv` types and defaults it; the treatment lives in Input's
		// resolver, which the trigger and the hex field both call.
		variant: { primary: {}, secondary: {} },
		// The empty `false` branches are load-bearing typing — see button.variants.ts.
		isDisabled: { true: { root: "opacity-50" }, false: {} },
		isInvalid: { true: {}, false: {} },
		isSelected: { true: { swatch: "border-foreground" }, false: { swatch: "border-transparent" } },
	},
	defaultVariants: {
		size: COLOR_PICKER_DEFAULT_SIZE,
		variant: COLOR_PICKER_DEFAULT_VARIANT,
		isDisabled: false,
		isInvalid: false,
		isSelected: false,
	},
});

/** What a picker was given at its own call site. */
export type ColorPickerOwnAxes = {
	size?: ColorPickerSize;
	variant?: ColorPickerVariant;
	isDisabled?: boolean;
	isInvalid?: boolean;
	isReadOnly?: boolean;
};

/** What an enclosing `Field` publishes, or null outside one. */
export type ColorPickerFieldAxes = { isDisabled?: boolean; isInvalid?: boolean };

/** Every axis settled, ready for {@link colorPickerVariants} and for context. */
export type ColorPickerAxes = Required<ColorPickerOwnAxes>;

/**
 * Settles a picker's axes: its own props, then an enclosing `Field`, then the defaults.
 *
 * `??` throughout, so `isDisabled={false}` inside `<Field isDisabled>` opts out.
 * A `Field` reaches the two state axes only — it has no size, no variant and no
 * read-only, and a test pins that it cannot acquire one by accident.
 */
export function resolveColorPickerAxes({
	own,
	field,
}: {
	own?: ColorPickerOwnAxes;
	field?: ColorPickerFieldAxes | null;
}): ColorPickerAxes {
	return {
		size: own?.size ?? COLOR_PICKER_DEFAULT_SIZE,
		variant: own?.variant ?? COLOR_PICKER_DEFAULT_VARIANT,
		isDisabled: own?.isDisabled ?? field?.isDisabled ?? false,
		isInvalid: own?.isInvalid ?? field?.isInvalid ?? false,
		isReadOnly: own?.isReadOnly ?? false,
	};
}

/** The area's `accessibilityValue.text` — "Saturation 60 percent, brightness 80 percent". */
export function describeAreaValue({ s, v }: Hsva): string {
	return `Saturation ${Math.round(s * 100)} percent, brightness ${Math.round(v * 100)} percent`;
}

/** The hue track's `accessibilityValue.text` — "Hue 210 degrees, blue". */
export function describeHueValue(hue: number): string {
	const degrees = Math.round(hue) % 360;
	return `Hue ${degrees} degrees, ${describeHue(degrees)}`;
}

/** The alpha track's `accessibilityValue.text` — "Opacity 50 percent". */
export function describeAlphaValue(alpha: number): string {
	return `Opacity ${Math.round(alpha * 100)} percent`;
}

/**
 * A part's accessible name.
 *
 * The part's own name — "Saturation and brightness", "Hue" — prefixed by the
 * enclosing `Field.Label`'s text, so VoiceOver reads "Accent, hue" rather than
 * a bare "Hue" that says nothing about what is being coloured. A caller's
 * `accessibilityLabel` wins outright.
 */
export function resolveColorPickerLabel({
	part,
	label,
	override,
}: {
	part: string;
	label?: string | null;
	override?: string;
}): string {
	if (override !== undefined) return override;
	if (!label) return part;
	return `${label}, ${part.charAt(0).toLowerCase()}${part.slice(1)}`;
}

/** The trigger row's name — "Accent, #f59e0b, opens picker", or "Colour, …" outside a `Field`. */
export function resolveTriggerAccessibilityLabel({ hex, label }: { hex: string; label?: string | null }): string {
	return `${label || "Colour"}, ${hex}, opens picker`;
}

export type ColorPickerVariantProps = VariantProps<typeof colorPickerVariants>;
