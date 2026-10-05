import { type ReactElement, type ReactNode, useCallback, useLayoutEffect, useMemo } from "react";
import { type AccessibilityActionEvent, type LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { FlowNodeProvider, useFlowGroup, useFlowPart } from "./flow.context";
import {
	FLOW_DEFAULTS,
	FLOW_LAYER_EXTENT,
	flowVariants,
	resolveAccessibilityMove,
	resolveNodeAccessibilityActions,
	resolveNodeDrag,
} from "./flow.variants";
import { type FlowPoint, flowGeometry } from "./flow-geometry";

export type FlowNodeProps = {
	/** Unique across the canvas — groups included. Edges name it. */
	id: string;
	/** Where the node's top-left corner sits, in graph units. The app owns it. */
	position: FlowPoint;
	/** Takes a drag. A node that is not draggable also stays put when its group moves. */
	isDraggable?: boolean;
	/** Clamped inside its group while dragged. */
	isConfined?: boolean;
	/** Cannot be dragged on its own, but still moves with its group. */
	isPinned?: boolean;
	/** Draws a ring and announces the node as selected. */
	isSelected?: boolean;
	/** A tap on the node, and the assistive "activate". */
	onPress?: () => void;
	/** Adds an assistive "Delete" action. The app removes the node. */
	onDelete?: () => void;
	/** How far one assistive move shifts the node, in graph units. */
	accessibilityMoveStep?: number;
	/** What a screen reader calls the node. Defaults to its id. */
	accessibilityLabel?: string;
	className?: string;
	testID?: string;
	children?: ReactNode;
};

/**
 * One node — any view, positioned in graph units, dragged on the UI thread.
 *
 * **A drag never renders.** The pan writes this node's shared position every frame, the layer's
 * transform turns it into pixels, and every edge reading it reroutes on the same frame. React
 * hears about it once, from `onNodeDragEnd`, and the app's new `position` lands on the value the
 * drag already left — so nothing jumps.
 *
 * **Its gesture blocks the canvas's.** A drag that starts on a node moves the node, not the canvas;
 * a node that cannot be dragged lets the canvas pan straight through it. A tap is exclusive with
 * the drag, so a press only fires when the finger did not travel.
 *
 * **One accessibility element.** The node's content merges into one stop named by
 * `accessibilityLabel`, with actions for everything a finger can do: activate, the four moves,
 * a "Connect" per valid target, and delete. Each reports through the same callback the gesture
 * does, so the app has one path to handle either.
 */
export function FlowNode({
	id,
	position,
	isDraggable = true,
	isConfined = false,
	isPinned = false,
	isSelected = false,
	onPress,
	onDelete,
	accessibilityMoveStep = FLOW_DEFAULTS.accessibilityMoveStep,
	accessibilityLabel,
	className,
	testID,
	children,
}: FlowNodeProps): ReactElement {
	const flow = useFlowPart("Flow.Node");
	const group = useFlowGroup();
	const entry = flow.registry.ensure(id);
	const label = accessibilityLabel ?? id;
	const drag = resolveNodeDrag({ isDraggable, isLocked: flow.isLocked, isPinned });
	const slots = flowVariants();
	const { notifyRegistry, notifyMeasured, viewport, canvasGestures, onNodeDragEnd } = flow;

	// The worklets below capture these shared values and nothing else: a plain object captured by a
	// worklet is frozen in development, and `entry.meta` is written from the effects below.
	const { position: positionValue, size: sizeValue } = entry;
	const groupPosition = group?.entry.position;
	const groupSize = group?.entry.size;
	const isClamped = isConfined && group !== null;

	useLayoutEffect(() => {
		entry.meta.kind = "node";
		entry.meta.label = label;
		entry.meta.groupId = group?.id;
		entry.meta.ridesGroup = drag.ridesGroup;
		entry.meta.isConfined = isConfined;
		entry.meta.isMounted = true;
		notifyRegistry();
	}, [drag.ridesGroup, entry, group?.id, isConfined, label, notifyRegistry]);

	useLayoutEffect(
		() => () => {
			entry.meta.isMounted = false;
			entry.meta.isMeasured = false;
			notifyRegistry();
		},
		[entry, notifyRegistry]
	);

	useLayoutEffect(() => {
		positionValue.value = { x: position.x, y: position.y };
	}, [position.x, position.y, positionValue]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			sizeValue.value = { height, width };
			entry.meta.isMeasured = true;
			notifyMeasured();
		},
		[entry, notifyMeasured, sizeValue]
	);

	const reportMove = useCallback((next: FlowPoint) => onNodeDragEnd(id, next), [id, onNodeDragEnd]);
	const press = useCallback(() => onPress?.(), [onPress]);

	const start = useSharedValue<FlowPoint>({ x: 0, y: 0 });

	const gesture = useMemo(() => {
		const pan = Gesture.Pan()
			.enabled(drag.canDrag)
			.minDistance(FLOW_DEFAULTS.dragMinDistance)
			.maxPointers(1)
			.onStart(() => {
				start.value = positionValue.value;
			})
			.onUpdate((event) => {
				const zoom = viewport.value.zoom;
				const next = { x: start.value.x + event.translationX / zoom, y: start.value.y + event.translationY / zoom };
				if (isClamped && groupPosition && groupSize) {
					positionValue.value = flowGeometry().clampPositionToRect(next, sizeValue.value, {
						...groupPosition.value,
						...groupSize.value,
					});
				} else {
					positionValue.value = next;
				}
			})
			.onEnd((_event, success) => {
				if (success) scheduleOnRN(reportMove, positionValue.value);
			})
			.blocksExternalGesture(...canvasGestures);

		const tap = Gesture.Tap()
			.enabled(onPress !== undefined)
			.onEnd((_event, success) => {
				if (success) scheduleOnRN(press);
			});

		return { composed: Gesture.Exclusive(pan, tap), pan };
	}, [
		canvasGestures,
		drag.canDrag,
		groupPosition,
		groupSize,
		isClamped,
		onPress,
		positionValue,
		press,
		reportMove,
		sizeValue,
		start,
		viewport,
	]);

	const positionStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: positionValue.value.x }, { translateY: positionValue.value.y }],
	}));

	const accessibility = useMemo(
		() =>
			resolveNodeAccessibilityActions({
				canActivate: onPress !== undefined,
				canDelete: onDelete !== undefined,
				canMove: drag.canDrag,
				isValidConnection: flow.isValidConnection,
				node: { handles: flow.entries.find((candidate) => candidate.id === id)?.handles ?? [], id, label },
				others: flow.entries.filter((candidate) => candidate.kind === "node"),
			}),
		[drag.canDrag, flow.entries, flow.isValidConnection, id, label, onDelete, onPress]
	);

	const { connect } = flow;
	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const name = event.nativeEvent.actionName;
			if (name === "activate") return onPress?.();
			if (name === "delete") return onDelete?.();
			const connection = accessibility.connections[name];
			if (connection) {
				connect(connection);
				return;
			}
			const delta = resolveAccessibilityMove(name, accessibilityMoveStep);
			if (!delta) return;
			const current = positionValue.value;
			const moved = { x: current.x + delta.x, y: current.y + delta.y };
			const next =
				isClamped && groupPosition && groupSize
					? flowGeometry().clampPositionToRect(moved, sizeValue.value, { ...groupPosition.value, ...groupSize.value })
					: moved;
			positionValue.value = next;
			reportMove(next);
		},
		[
			accessibility.connections,
			accessibilityMoveStep,
			connect,
			groupPosition,
			groupSize,
			isClamped,
			onDelete,
			onPress,
			positionValue,
			reportMove,
			sizeValue,
		]
	);

	const nodeContext = useMemo(
		() => ({ entry, id, nodeGesture: gesture.pan, notifyHandles: notifyRegistry }),
		[entry, gesture.pan, id, notifyRegistry]
	);

	return (
		<FlowNodeProvider value={nodeContext}>
			<GestureDetector gesture={gesture.composed}>
				<Animated.View
					accessibilityActions={accessibility.actions}
					accessibilityLabel={label}
					accessibilityState={{ selected: isSelected }}
					accessible
					className={slots.node({ className })}
					onAccessibilityAction={handleAccessibilityAction}
					onLayout={handleLayout}
					style={[LAYER_ORIGIN, positionStyle]}
					testID={testID}
				>
					{children}
					{isSelected ? <View className={slots.selection()} pointerEvents="none" /> : null}
				</Animated.View>
			</GestureDetector>
		</FlowNodeProvider>
	);
}
FlowNode.displayName = "DelacourUI.Flow.Node";

/** The graph's origin inside the node layer — see `FLOW_LAYER_EXTENT`. */
const LAYER_ORIGIN = { left: FLOW_LAYER_EXTENT, top: FLOW_LAYER_EXTENT } as const;
