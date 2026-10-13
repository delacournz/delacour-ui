import type { ReactNode } from "react";
import type { InputProps } from "../input/input";
import type { NumberInputStepperPosition } from "./number-input.variants";

/**
 * What a number input forwards to its `TextInput`.
 *
 * Everything `Input` takes except what the number input owns: the text and its
 * change handler (the draft model), and the axes the group draws the box from.
 * Shared by the root's `inputProps` and `NumberInput.Field`.
 */
export type NumberInputFieldOwnProps = Omit<
	InputProps,
	"value" | "defaultValue" | "onChangeText" | "variant" | "size" | "isInvalid" | "isDisabled" | "multiline"
>;

/** The shape of `NumberInput.Decrement` and `NumberInput.Increment`. */
export type NumberInputStepperProps = {
	/**
	 * Which end of the box the stepper sits at, which decides the side its
	 * separator is drawn on. Defaults to `start` for Decrement and `end` for
	 * Increment; set it when a custom anatomy puts both on one side.
	 */
	position?: NumberInputStepperPosition;
	/** Read by a screen reader. Defaults to "Decrease" / "Increase". */
	accessibilityLabel?: string;
	className?: string;
	/** Replaces the minus or plus glyph. An `Icon` inherits the stepper's size and colour. */
	children?: ReactNode;
	testID?: string;
};
