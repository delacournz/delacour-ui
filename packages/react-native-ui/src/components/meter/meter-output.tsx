import type { ReactElement } from "react";
import { PROGRESS_OUTPUT_TEXT_SIZE, progressVariants } from "../progress/progress.variants";
import { Text, type TextPresetProps } from "../text";
import { useMeterPart } from "./meter.context";
import type { MeterRenderChildren } from "./meter.types";

export type MeterOutputProps = Omit<TextPresetProps, "children"> & {
	/** Custom content, or a function called with the meter's settled state. */
	children?: MeterRenderChildren;
};

/**
 * The reading, formatted — `68%` by default, or `valueLabel` when one is given.
 *
 * A function child is handed the meter's state, including the `region` it was
 * judged to be in. Words it draws are seen but not heard — see below — so a
 * judgement a screen reader must hear belongs in a `valueLabel` function.
 *
 * **Hidden from assistive technology on purpose.** The root already publishes
 * the reading as `accessibilityValue`, so a readout left visible inside it would
 * be read twice.
 */
export function MeterOutput({ children, className, size, ...props }: MeterOutputProps): ReactElement | null {
	const { size: meterSize, renderProps } = useMeterPart("Meter.Output");

	const content = typeof children === "function" ? children(renderProps) : (children ?? renderProps.formatted);

	if (content === null || content === undefined) return null;

	return (
		<Text.Label
			accessibilityElementsHidden
			className={progressVariants({ size: meterSize }).output({ className })}
			importantForAccessibility="no-hide-descendants"
			size={size ?? PROGRESS_OUTPUT_TEXT_SIZE[meterSize]}
			{...props}
		>
			{content}
		</Text.Label>
	);
}
MeterOutput.displayName = "DelacourUI.Meter.Output";
