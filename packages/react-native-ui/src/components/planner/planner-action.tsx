import type { ReactElement } from "react";
import { Button, type ButtonProps } from "../button";

export type PlannerActionProps = ButtonProps;

/**
 * A control of your own in the header — add an entry, filter, settings.
 *
 * A `Button`, ghost and icon-sized to sit beside `Nav`; every prop is the
 * button's, so a labelled one is `size="sm"`. Give an icon-only one an
 * `accessibilityLabel`.
 */
export function PlannerAction(props: PlannerActionProps): ReactElement {
	return <Button size="icon-sm" variant="ghost" {...props} />;
}
PlannerAction.displayName = "DelacourUI.Planner.Action";
