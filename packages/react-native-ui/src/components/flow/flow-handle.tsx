import { type ReactElement, useCallback, useLayoutEffect, useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useFlowNode, useFlowPart } from "./flow.context";
import {
	FLOW_DEFAULTS,
	FLOW_HANDLE_HIT_SLOP,
	type FlowHandleRef,
	flowVariants,
	resolveHandleStyle,
} from "./flow.variants";
import {
	type FlowHandlePlacement,
	type FlowHandleType,
	type FlowPoint,
	type FlowSide,
	flowGeometry,
} from "./flow-geometry";
import type { FlowRegistryHandle } from "./flow-registry";

/**
 * The UI thread's handle map, rebuilt from the JS thread's list. Never spread from
 * `entry.handles.value`: a shared value written on the JS thread reads back stale until the UI
 * thread applies it, so the second handle on a node would erase the first.
 */
function placements(handles: readonly FlowRegistryHandle[]): Record<string, FlowHandlePlacement> {
	return Object.fromEntries(handles.map((handle) => [handle.id, { offset: handle.offset, side: handle.side }]));
}

export type FlowHandleProps = {
	/** Unique within its node. An edge names it as `"nodeId.handleId"`. */
	id?: string;
	/** The side of the node it sits on. */
	side?: FlowSide;
	/** Whether a connection may leave it, arrive at it, or both. */
	type?: FlowHandleType;
	/** How far along its side, from 0 to 1. */
	offset?: number;
	/** Still routes edges and takes a connection, but draws nothing. */
	isHidden?: boolean;
	/** What the node's "Connect" actions call this handle. Defaults to its id. */
	accessibilityLabel?: string;
	className?: string;
	testID?: string;
};

/**
 * A point on a node's side where edges attach and connections are dragged from.
 *
 * **It is placed by percentage, not by measurement**, so it needs no layout pass and stays on its
 * side when the node resizes. The same side and offset are written into the node's shared handle
 * map, which is what an edge naming `"node.handle"` routes to on the UI thread.
 *
 * **Its drag blocks the node's and the canvas's.** A finger that starts on a handle draws a
 * connection; it never moves the node or pans. On release the canvas hit tests every other handle
 * and asks the app, through `isValidConnection` and `onConnect`, whether to join them.
 *
 * Not an accessibility element: the node owns one "Connect" action per valid pairing instead.
 */
export function FlowHandle({
	id = "default",
	side = "right",
	type = "source",
	offset = FLOW_DEFAULTS.handleOffset,
	isHidden = false,
	accessibilityLabel,
	className,
	testID,
}: FlowHandleProps): ReactElement {
	const { viewport, preview, canvasGestures, finishConnection, isLocked } = useFlowPart("Flow.Handle");
	const node = useFlowNode("Flow.Handle");
	const { entry, nodeGesture, notifyHandles } = node;
	const slots = flowVariants({ isHandleHidden: isHidden });

	useLayoutEffect(() => {
		const handle = { id, label: accessibilityLabel, offset, side, type };
		entry.meta.handles = [...entry.meta.handles.filter((existing) => existing.id !== id), handle];
		entry.handles.value = placements(entry.meta.handles);
		notifyHandles();
		return () => {
			entry.meta.handles = entry.meta.handles.filter((existing) => existing.id !== id);
			entry.handles.value = placements(entry.meta.handles);
			notifyHandles();
		};
	}, [accessibilityLabel, entry, id, notifyHandles, offset, side, type]);

	const nodeId = node.id;
	const release = useCallback(
		(at: FlowPoint) => {
			const from: FlowHandleRef = { handleId: id, nodeId, type };
			finishConnection(from, at);
		},
		[finishConnection, id, nodeId, type]
	);

	const { position, size } = entry;
	const origin = useSharedValue<FlowPoint>({ x: 0, y: 0 });

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(!isLocked)
				.maxPointers(1)
				.hitSlop(FLOW_HANDLE_HIT_SLOP)
				.onStart(() => {
					const rect = { ...position.value, ...size.value };
					const from = flowGeometry().resolveHandlePoint(rect, side, offset);
					origin.value = from;
					preview.value = { from, fromSide: side, isActive: true, to: from };
				})
				.onUpdate((event) => {
					const zoom = viewport.value.zoom;
					const to = { x: origin.value.x + event.translationX / zoom, y: origin.value.y + event.translationY / zoom };
					preview.value = { ...preview.value, to };
				})
				.onEnd((_event, success) => {
					if (success) scheduleOnRN(release, preview.value.to);
				})
				.onFinalize(() => {
					preview.value = { ...preview.value, isActive: false };
				})
				.blocksExternalGesture(nodeGesture, ...canvasGestures),
		[canvasGestures, isLocked, nodeGesture, offset, origin, position, preview, release, side, size, viewport]
	);

	return (
		<GestureDetector gesture={gesture}>
			<View
				accessibilityElementsHidden
				className={slots.handle({ className })}
				importantForAccessibility="no-hide-descendants"
				style={resolveHandleStyle(side, offset)}
				testID={testID}
			/>
		</GestureDetector>
	);
}
FlowHandle.displayName = "DelacourUI.Flow.Handle";
