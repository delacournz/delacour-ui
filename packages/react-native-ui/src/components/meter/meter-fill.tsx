import type { ReactElement } from "react";
import { Progress, type ProgressFillProps } from "../progress";
import { useMeterPart } from "./meter.context";

export type MeterFillProps = ProgressFillProps;

/**
 * The painted bar, in the colour the reading was judged to be.
 *
 * The progress bar's own fill: a transform on the UI thread, one timing per new
 * reading, landing on the value without travel under the system's reduce-motion
 * setting. A change of colour is a class, so it lands on the render that judged
 * it.
 */
export function MeterFill(props: MeterFillProps): ReactElement {
	useMeterPart("Meter.Fill");
	return <Progress.Fill {...props} />;
}
MeterFill.displayName = "DelacourUI.Meter.Fill";
