import type { VariantProps } from "tailwind-variants";
import { cn } from "../../lib/cn";
import { tv } from "../../lib/tv";
import type { InputSize } from "../input/input.variants";

/** Which end of the box a stepper sits at. Its separator is drawn on the other side, facing the field. */
export const NUMBER_INPUT_STEPPER_POSITIONS = ["start", "end"] as const;

export type NumberInputStepperPosition = (typeof NUMBER_INPUT_STEPPER_POSITIONS)[number];

/** Theme token a stepper's glyph is drawn in, and the one it takes when it cannot step. */
export const NUMBER_INPUT_STEPPER_ICON_TOKEN = "foreground";
export const NUMBER_INPUT_STEPPER_DISABLED_ICON_TOKEN = "muted-foreground";

/**
 * Layout the `Input.Group` row takes under a number input.
 *
 * The group's own gutter and gap would inset the steppers from the border, so
 * their targets would stop short of the box's edge and the separator would
 * float. The steppers carry their own width instead. Layout only — the border,
 * fill, height and corner are the group's, untouched.
 */
export const NUMBER_INPUT_GROUP_CLASS = "gap-0 px-0";

/** Opacity a pressed stepper fades to. */
export const NUMBER_INPUT_STEPPER_PRESSED_OPACITY = 0.5;

/**
 * Styling for a number input's two steppers.
 *
 * Only the steppers are new: the box, the field's type scale and every state
 * colour come from `inputVariants`, through the `Input.Group` the root renders.
 *
 * A stepper is as wide as the box is tall — `w-input-*` against the box's
 * `h-input-*` — and stretches to the row's height, so it is a square edge to
 * edge rather than a button floating in a gutter. At `md` and `lg` that is 44pt
 * and over; `sm` makes the rest up with {@link resolveStepperHitSlop}.
 *
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
 */
export const numberInputVariants = tv({
	slots: {
		/** The stepper's square — its width, its separator. Worn by the decorator it sits in. */
		stepper: "items-center justify-center self-stretch border-border",
		/** The pressable surface inside the square, filling it, so the press fade leaves the separator alone. */
		stepperTarget: "flex-1 items-center justify-center self-stretch",
		/** Edge length of the stepper's glyph. */
		stepperIcon: "",
	},
	variants: {
		size: {
			sm: { stepper: "w-input-sm", stepperIcon: "size-icon-sm" },
			md: { stepper: "w-input-md", stepperIcon: "size-icon-md" },
			lg: { stepper: "w-input-lg", stepperIcon: "size-icon-lg" },
		},
		position: {
			start: { stepper: "border-e" },
			end: { stepper: "border-s" },
		},
		// Disabled is carried by the glyph's colour token, not by an opacity here:
		// the stepper's press fade is an animated style, which owns `opacity` on
		// the view and would overwrite a class's. The empty branches keep the prop
		// typed as `boolean` — see button.variants.ts.
		isDisabled: { true: {}, false: {} },
	},
	defaultVariants: {
		size: "md",
		position: "start",
		isDisabled: false,
	},
});

/** The colour token a stepper's glyph takes. Muted when it cannot step. */
export function resolveStepperIconToken({ isDisabled }: { isDisabled: boolean }): string {
	return isDisabled ? NUMBER_INPUT_STEPPER_DISABLED_ICON_TOKEN : NUMBER_INPUT_STEPPER_ICON_TOKEN;
}

/**
 * Points a stepper's touch target reaches past its square, on every side.
 *
 * `md` is 44pt and `lg` 52, so they need nothing. `sm` is 36: four points each
 * way brings it to the 44pt a finger needs, without growing what is drawn.
 */
export function resolveStepperHitSlop(size: InputSize): number {
	return size === "sm" ? 4 : 0;
}

/**
 * The class the number input's `TextInput` adds to the field's own.
 *
 * Centred between the steppers, with a hair of padding so a long value does not
 * touch the separators. The type scale and colour still come from `Input`.
 */
export function resolveNumberInputFieldClass(className?: string): string {
	return cn("px-1 text-center", className);
}

export type NumberInputVariantProps = VariantProps<typeof numberInputVariants>;
