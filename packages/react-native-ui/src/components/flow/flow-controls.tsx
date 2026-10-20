import type { ReactElement } from "react";
import { IconFullScreen, IconLock, IconMinusSmall, IconPlusSmall, IconUnlocked } from "../../icons/central";
import { Button } from "../button";
import { Icon } from "../icon";
import { Surface } from "../surface";
import { useFlowPart } from "./flow.context";
import { FLOW_CONTROL_LABELS, FLOW_DEFAULTS, flowVariants } from "./flow.variants";

export type FlowControlsProps = {
	/** Zoom in and zoom out buttons. */
	showZoom?: boolean;
	/** A button that frames every node. */
	showFit?: boolean;
	/** A toggle that locks pan, zoom and every drag. */
	showLock?: boolean;
	/** How far one zoom press scales. */
	step?: number;
	className?: string;
};

/**
 * Zoom, fit and lock buttons, floating in the canvas's bottom-left corner.
 *
 * **A plain absolutely positioned `Surface`**, outside the transformed layer, so it neither pans
 * nor scales. Each button is a labelled square `Button`; the lock reports its state as selected.
 * Everything it does is also on `useFlow()`, for an app that wants its own controls.
 */
export function FlowControls({
	showZoom = true,
	showFit = true,
	showLock = true,
	step = FLOW_DEFAULTS.controlsStep,
	className,
}: FlowControlsProps): ReactElement {
	const { zoomBy, fitView, isLocked, setLocked } = useFlowPart("Flow.Controls");
	const slots = flowVariants();

	return (
		<Surface className={slots.controls({ className })} padding="none">
			{showZoom ? (
				<Button
					accessibilityLabel={FLOW_CONTROL_LABELS.zoomIn}
					isDisabled={isLocked}
					onPress={() => zoomBy(step)}
					size="icon-sm"
					testID="flow-zoom-in"
					variant="ghost"
				>
					<Icon icon={IconPlusSmall} />
				</Button>
			) : null}
			{showZoom ? (
				<Button
					accessibilityLabel={FLOW_CONTROL_LABELS.zoomOut}
					isDisabled={isLocked}
					onPress={() => zoomBy(1 / step)}
					size="icon-sm"
					testID="flow-zoom-out"
					variant="ghost"
				>
					<Icon icon={IconMinusSmall} />
				</Button>
			) : null}
			{showFit ? (
				<Button
					accessibilityLabel={FLOW_CONTROL_LABELS.fit}
					isDisabled={isLocked}
					onPress={() => fitView()}
					size="icon-sm"
					testID="flow-fit"
					variant="ghost"
				>
					<Icon icon={IconFullScreen} />
				</Button>
			) : null}
			{showLock ? (
				<Button
					accessibilityLabel={FLOW_CONTROL_LABELS.lock}
					accessibilityState={{ selected: isLocked }}
					onPress={() => setLocked(!isLocked)}
					size="icon-sm"
					testID="flow-lock"
					variant={isLocked ? "secondary" : "ghost"}
				>
					<Icon icon={isLocked ? IconLock : IconUnlocked} />
				</Button>
			) : null}
		</Surface>
	);
}
FlowControls.displayName = "DelacourUI.Flow.Controls";
