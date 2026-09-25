import type { ReactElement } from "react";
import { Progress, type ProgressTrackProps } from "../progress";
import { useMeterPart } from "./meter.context";

export type MeterTrackProps = ProgressTrackProps;

/**
 * The continuous groove the fill slides along — the progress bar's own track.
 *
 * For a segmented meter write `Meter.Segments` instead.
 */
export function MeterTrack(props: MeterTrackProps): ReactElement {
	useMeterPart("Meter.Track");
	return <Progress.Track {...props} />;
}
MeterTrack.displayName = "DelacourUI.Meter.Track";
