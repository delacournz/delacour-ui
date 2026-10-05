import type { ReactElement } from "react";
import { IconPlusSmall } from "../../icons/central";
import type { NumberInputStepperProps } from "./number-input.types";
import { NumberInputStepper } from "./number-input-stepper";

/**
 * The plus button. Tap to step up once; hold to repeat, faster the longer it is
 * held. Disabled at the max.
 *
 * Sits at the end of the box by default, with its separator facing the field.
 */
export function NumberInputIncrement({ position = "end", ...props }: NumberInputStepperProps): ReactElement {
	return (
		<NumberInputStepper
			defaultLabel="Increase"
			direction={1}
			icon={IconPlusSmall}
			part="NumberInput.Increment"
			position={position}
			{...props}
		/>
	);
}
NumberInputIncrement.displayName = "DelacourUI.NumberInput.Increment";
