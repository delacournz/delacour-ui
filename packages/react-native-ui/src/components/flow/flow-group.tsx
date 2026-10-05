import { type ReactElement, type ReactNode, useCallback, useLayoutEffect, useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Surface } from "../surface";
import { Text } from "../text";
import { FlowGroupProvider, useFlowPart } from "./flow.context";
import { FLOW_DEFAULTS, FLOW_LAYER_EXTENT, flowVariants } from "./flow.variants";
import type { FlowPoint, FlowSize } from "./flow-geometry";

export type FlowGroupProps = {
	/** Unique across the canvas — nodes included. */
	id: string;
	/** The group's top-left corner, in graph units. The app owns it. */
	position: FlowPoint;
	/** The group's box, in graph units. */
	size: FlowSize;
	/** Drawn as a chip in the group's top-left corner. */
	label?: string;
	/** Dragging the group's box carries every node in it. */
	isDraggable?: boolean;
	className?: string;
	testID?: string;
	children?: ReactNode;
};

/**
 * A labelled box that nodes sit in and move with.
 *
 * **Not a coordinate space.** Its nodes' positions are graph coordinates like every other node's,
 * so an edge, a fit and a minimap never have to know a node is grouped. The box is drawn beneath
 * its children, as a sibling rather than a parent, so an edge can still pass between them.
 *
 * **One drag moves the box and its riders on the UI thread.** The pan offsets the group's shared
 * position and every rider's in the same worklet, then `onNodeDragEnd` fires once for the group
 * and once per rider. A node with `isDraggable={false}` does not ride; a pinned one does.
 */
export function FlowGroup({
	id,
	position,
	size,
	label,
	isDraggable = true,
	className,
	testID,
	children,
}: FlowGroupProps): ReactElement {
	const flow = useFlowPart("Flow.Group");
	const { notifyRegistry, notifyMeasured, viewport, canvasGestures, onNodeDragEnd, entries, isLocked } = flow;
	const entry = flow.registry.ensure(id);
	const slots = flowVariants();
	const { position: positionValue, size: sizeValue } = entry;

	useLayoutEffect(() => {
		entry.meta.kind = "group";
		entry.meta.label = label ?? id;
		entry.meta.groupId = undefined;
		entry.meta.ridesGroup = false;
		entry.meta.isMounted = true;
		notifyRegistry();
	}, [entry, id, label, notifyRegistry]);

	useLayoutEffect(
		() => () => {
			entry.meta.isMounted = false;
			notifyRegistry();
		},
		[entry, notifyRegistry]
	);

	useLayoutEffect(() => {
		positionValue.value = { x: position.x, y: position.y };
	}, [position.x, position.y, positionValue]);

	useLayoutEffect(() => {
		sizeValue.value = { height: size.height, width: size.width };
		entry.meta.size = { height: size.height, width: size.width };
		entry.meta.isMeasured = true;
		notifyMeasured();
	}, [entry, notifyMeasured, size.height, size.width, sizeValue]);

	const riders = useMemo(
		() => entries.filter((candidate) => candidate.groupId === id && candidate.ridesGroup),
		[entries, id]
	);
	const riderPositions = useMemo(() => riders.map((rider) => rider.entry.position), [riders]);
	const riderIds = useMemo(() => riders.map((rider) => rider.id), [riders]);

	const report = useCallback(
		(groupAt: FlowPoint, riderAt: FlowPoint[]) => {
			onNodeDragEnd(id, groupAt);
			riderIds.forEach((riderId, index) => {
				const at = riderAt[index];
				if (at) onNodeDragEnd(riderId, at);
			});
		},
		[id, onNodeDragEnd, riderIds]
	);

	const start = useSharedValue<FlowPoint>({ x: 0, y: 0 });
	const riderStarts = useSharedValue<FlowPoint[]>([]);

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(isDraggable && !isLocked)
				.minDistance(FLOW_DEFAULTS.dragMinDistance)
				.maxPointers(1)
				.onStart(() => {
					start.value = positionValue.value;
					riderStarts.value = riderPositions.map((rider) => rider.value);
				})
				.onUpdate((event) => {
					const zoom = viewport.value.zoom;
					const dx = event.translationX / zoom;
					const dy = event.translationY / zoom;
					positionValue.value = { x: start.value.x + dx, y: start.value.y + dy };
					const starts = riderStarts.value;
					riderPositions.forEach((rider, index) => {
						const from = starts[index];
						if (from) rider.value = { x: from.x + dx, y: from.y + dy };
					});
				})
				.onEnd((_event, success) => {
					if (!success) return;
					scheduleOnRN(
						report,
						positionValue.value,
						riderPositions.map((rider) => rider.value)
					);
				})
				.blocksExternalGesture(...canvasGestures),
		[canvasGestures, isDraggable, isLocked, positionValue, report, riderPositions, riderStarts, start, viewport]
	);

	const boxStyle = useAnimatedStyle(() => ({
		height: sizeValue.value.height,
		transform: [{ translateX: positionValue.value.x }, { translateY: positionValue.value.y }],
		width: sizeValue.value.width,
	}));

	const context = useMemo(() => ({ entry, id }), [entry, id]);

	return (
		<FlowGroupProvider value={context}>
			<GestureDetector gesture={gesture}>
				<Animated.View
					accessibilityLabel={label}
					accessible={label !== undefined}
					className={slots.group({ className })}
					style={[LAYER_ORIGIN, boxStyle]}
					testID={testID}
				>
					{label === undefined ? null : (
						<Surface className={slots.groupLabel()} padding="none" variant="secondary">
							<Text.Caption>{label}</Text.Caption>
						</Surface>
					)}
				</Animated.View>
			</GestureDetector>
			{children}
		</FlowGroupProvider>
	);
}
FlowGroup.displayName = "DelacourUI.Flow.Group";

/** The graph's origin inside the node layer — see `FLOW_LAYER_EXTENT`. */
const LAYER_ORIGIN = { left: FLOW_LAYER_EXTENT, top: FLOW_LAYER_EXTENT } as const;
