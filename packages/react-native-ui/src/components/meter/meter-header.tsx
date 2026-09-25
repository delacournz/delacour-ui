import type { ReactElement } from "react";
import { Progress, type ProgressHeaderProps } from "../progress";
import { useMeterPart } from "./meter.context";

export type MeterHeaderProps = ProgressHeaderProps;

/**
 * The row above the track: a label at the start, a readout at the end.
 *
 * The progress bar's own header — the meter publishes that bar's context, so the
 * row, its gap and its type step are shared rather than restated.
 */
export function MeterHeader(props: MeterHeaderProps): ReactElement {
	useMeterPart("Meter.Header");
	return <Progress.Header {...props} />;
}
MeterHeader.displayName = "DelacourUI.Meter.Header";
