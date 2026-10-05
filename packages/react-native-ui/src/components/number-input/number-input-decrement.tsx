import type { ReactElement } from "react";
import { IconMinusSmall } from "../../icons/central";
import type { NumberInputStepperProps } from "./number-input.types";
import { NumberInputStepper } from "./number-input-stepper";

/**
 * The minus button. Tap to step down once; hold to repeat, faster the longer it
 * is held. Disabled at the min.
 *
 * Sits at the start of the box by default, with its separator facing the field.
 */
export function NumberInputDecrement({ position = "start", ...props }: NumberInputStepperProps): ReactElement {
	return (
		<NumberInputStepper
			defaultLabel="Decrease"
			direction={-1}
			icon={IconMinusSmall}
			part="NumberInput.Decrement"
			position={position}
			{...props}
		/>
	);
}
NumberInputDecrement.displayName = "DelacourUI.NumberInput.Decrement";
