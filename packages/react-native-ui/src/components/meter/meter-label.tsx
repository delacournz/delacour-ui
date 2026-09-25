import type { ReactElement } from "react";
import { Progress, type ProgressLabelProps } from "../progress";
import { useMeterPart } from "./meter.context";

export type MeterLabelProps = ProgressLabelProps;

/**
 * What is being measured — "Storage", "Battery".
 *
 * Left visible to assistive technology: the root is one accessible element, and
 * a label inside it is what VoiceOver and TalkBack read as that element's name.
 * A meter without one announces a number with nothing attached to it.
 */
export function MeterLabel(props: MeterLabelProps): ReactElement {
	useMeterPart("Meter.Label");
	return <Progress.Label {...props} />;
}
MeterLabel.displayName = "DelacourUI.Meter.Label";
