import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import Svg from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import {
	type FlowContextValue,
	type FlowConnectionPreview as FlowPreviewValue,
	FlowProvider,
	FlowSvgLayerProvider,
} from "./flow.context";
import {
	FLOW_DEFAULTS,
	FLOW_LAYER_EXTENT,
	type FlowHandleRef,
	flowVariants,
	resolveDraggedConnection,
} from "./flow.variants";
import { FlowBackground } from "./flow-background";
import { FlowConnectionPreview } from "./flow-connection-preview";
import { FlowControls } from "./flow-controls";
import { FlowEdge } from "./flow-edge";
import {
	type FlowConnection,
	type FlowPoint,
	type FlowRect,
	type FlowSize,
	type FlowViewport,
	findHandleAt,
	fitViewport,
	flowGeometry,
	resolveHandlePoint,
	unionRects,
	zoomAround,
} from "./flow-geometry";
import { FlowGroup } from "./flow-group";
import { FlowHandle } from "./flow-handle";
import { FlowMiniMap } from "./flow-minimap";
import { FlowNode } from "./flow-node";
import { createFlowRegistry, type FlowSnapshotEntry } from "./flow-registry";
import { AnimatedMatrixG, type FlowMatrixGProps } from "./flow-svg";

export type FlowProps = {
	/** Where the canvas starts, when it does not fit on mount. */
	defaultViewport?: FlowViewport;
	minZoom?: number;
	maxZoom?: number;
	/** One- or two-finger pan of the canvas. */
	canPan?: boolean;
	/** Pinch to zoom, about the fingers. */
	canZoom?: boolean;
	/** Frames every node once they have all measured. */
	fitViewOnMount?: boolean;
	/** Space kept around the graph by a fit, in points. */
	fitViewPadding?: number;
	/** The viewport after a pan, a pinch, a zoom or a fit settles. */
	onViewportChange?: (viewport: FlowViewport) => void;
	/** A node or group was dragged or moved by an assistive action. The app moves it. */
	onNodeDragEnd?: (id: string, position: FlowPoint) => void;
	/** A connection was dragged between two handles, or chosen from a node's actions. The app adds it. */
	onConnect?: (connection: FlowConnection) => void;
	/** Refuses a connection before `onConnect` hears of it, and before a node offers it. */
	isValidConnection?: (connection: FlowConnection) => boolean;
	className?: string;
	testID?: string;
	children?: ReactNode;
};

type FlowLayers = { svg: ReactNode[]; nodes: ReactNode[]; overlay: ReactNode[] };

/**
 * Sorts the canvas's children into the three layers they draw in: SVG beneath, nodes in the
 * transformed view, chrome on top. Fragments and arrays are walked, so a `.map()` of edges works.
 */
function sortLayers(children: ReactNode, layers: FlowLayers = { nodes: [], overlay: [], svg: [] }): FlowLayers {
	Children.forEach(children, (child) => {
		if (!isValidElement<{ children?: ReactNode }>(child)) {
			if (child !== null && child !== undefined && typeof child !== "boolean") layers.nodes.push(child);
			return;
		}
		if (child.type === Fragment) sortLayers(child.props.children, layers);
		else if (child.type === FlowEdge || child.type === FlowBackground) layers.svg.push(child);
		else if (child.type === FlowControls || child.type === FlowMiniMap) layers.overlay.push(child);
		else layers.nodes.push(child);
	});
	return layers;
}

/** The rect of a mounted, measured entry — read on the JS thread. */
function rectOf(snapshot: FlowSnapshotEntry): FlowRect | null {
	if (!snapshot.entry.meta.isMeasured) return null;
	return { ...snapshot.entry.position.value, ...snapshot.entry.size.value };
}

function FlowRoot({
	defaultViewport,
	minZoom = FLOW_DEFAULTS.minZoom,
	maxZoom = FLOW_DEFAULTS.maxZoom,
	canPan = true,
	canZoom = true,
	fitViewOnMount = false,
	fitViewPadding = FLOW_DEFAULTS.fitViewPadding,
	onViewportChange,
	onNodeDragEnd,
	onConnect,
	isValidConnection,
	className,
	testID,
	children,
}: FlowProps): ReactElement {
	const [registry] = useState(createFlowRegistry);
	const [entries, setEntries] = useState<readonly FlowSnapshotEntry[]>([]);
	const [isLocked, setLocked] = useState(false);
	const isReducedMotion = useReducedMotion();
	const hasFitted = useRef(false);

	const viewport = useSharedValue<FlowViewport>(defaultViewport ?? { x: 0, y: 0, zoom: 1 });
	const container = useSharedValue<FlowSize>({ height: 0, width: 0 });
	const preview = useSharedValue<FlowPreviewValue>({
		from: { x: 0, y: 0 },
		fromSide: "right",
		isActive: false,
		to: { x: 0, y: 0 },
	});

	const notifyRegistry = useCallback(() => setEntries(registry.snapshot()), [registry]);

	const reportViewport = useCallback((next: FlowViewport) => onViewportChange?.(next), [onViewportChange]);

	const moveTo = useCallback(
		(target: FlowViewport, isAnimated: boolean) => {
			viewport.value =
				isAnimated && !isReducedMotion ? withTiming(target, { duration: FLOW_DEFAULTS.fitDuration }) : target;
			reportViewport(target);
		},
		[isReducedMotion, reportViewport, viewport]
	);

	const fitView = useCallback(
		(options?: { isAnimated?: boolean }) => {
			const rects = registry
				.snapshot()
				.map(rectOf)
				.filter((rect): rect is FlowRect => rect !== null);
			const target = fitViewport({
				bounds: unionRects(rects),
				container: container.value,
				maxZoom,
				minZoom,
				padding: fitViewPadding,
			});
			moveTo(target, options?.isAnimated ?? true);
		},
		[container, fitViewPadding, maxZoom, minZoom, moveTo, registry]
	);

	const fitWhenReady = useCallback(() => {
		if (!fitViewOnMount || hasFitted.current) return;
		const { width, height } = container.value;
		if (width === 0 || height === 0) return;
		const mounted = registry.snapshot();
		if (mounted.length === 0 || mounted.some((snapshot) => !snapshot.entry.meta.isMeasured)) return;
		hasFitted.current = true;
		fitView({ isAnimated: false });
	}, [container, fitView, fitViewOnMount, registry]);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			container.value = { height, width };
			fitWhenReady();
		},
		[container, fitWhenReady]
	);

	const zoomBy = useCallback(
		(factor: number) => {
			const { width, height } = container.value;
			moveTo(zoomAround(viewport.value, factor, { x: width / 2, y: height / 2 }, minZoom, maxZoom), true);
		},
		[container, maxZoom, minZoom, moveTo, viewport]
	);

	const getNodeRect = useCallback(
		(id: string) => {
			const snapshot = registry.snapshot().find((candidate) => candidate.id === id);
			return snapshot ? rectOf(snapshot) : null;
		},
		[registry]
	);

	const connect = useCallback(
		(connection: FlowConnection) => {
			if (isValidConnection?.(connection) === false) return false;
			onConnect?.(connection);
			return true;
		},
		[isValidConnection, onConnect]
	);

	const finishConnection = useCallback(
		(from: FlowHandleRef, at: FlowPoint) => {
			const candidates = registry.snapshot().flatMap((snapshot) => {
				const rect = rectOf(snapshot);
				if (snapshot.kind !== "node" || rect === null) return [];
				return snapshot.handles
					.filter((handle) => !(snapshot.id === from.nodeId && handle.id === from.handleId))
					.map((handle) => ({
						point: resolveHandlePoint(rect, handle.side, handle.offset),
						ref: { handleId: handle.id, nodeId: snapshot.id, type: handle.type },
					}));
			});
			const hit = findHandleAt(at, candidates, FLOW_DEFAULTS.connectRadius);
			if (hit === null) return;
			const connection = resolveDraggedConnection(from, hit.ref);
			if (connection !== null) connect(connection);
		},
		[connect, registry]
	);

	const handleNodeDragEnd = useCallback(
		(id: string, position: FlowPoint) => onNodeDragEnd?.(id, position),
		[onNodeDragEnd]
	);

	const panLast = useSharedValue<FlowPoint>({ x: 0, y: 0 });
	const pinchLast = useSharedValue(1);

	const canvas = useMemo(() => {
		const pan = Gesture.Pan()
			.enabled(canPan && !isLocked)
			.maxPointers(2)
			.onStart(() => {
				panLast.value = { x: 0, y: 0 };
			})
			.onUpdate((event) => {
				const current = viewport.value;
				viewport.value = {
					x: current.x + event.translationX - panLast.value.x,
					y: current.y + event.translationY - panLast.value.y,
					zoom: current.zoom,
				};
				panLast.value = { x: event.translationX, y: event.translationY };
			})
			.onEnd(() => {
				scheduleOnRN(reportViewport, viewport.value);
			});

		const pinch = Gesture.Pinch()
			.enabled(canZoom && !isLocked)
			.onStart(() => {
				pinchLast.value = 1;
			})
			.onUpdate((event) => {
				const factor = event.scale / pinchLast.value;
				const focal = { x: event.focalX, y: event.focalY };
				viewport.value = flowGeometry().zoomAround(viewport.value, factor, focal, minZoom, maxZoom);
				pinchLast.value = event.scale;
			})
			.onEnd(() => {
				scheduleOnRN(reportViewport, viewport.value);
			});

		return { composed: Gesture.Simultaneous(pan, pinch), list: [pan, pinch] };
	}, [canPan, canZoom, isLocked, maxZoom, minZoom, panLast, pinchLast, reportViewport, viewport]);

	const context = useMemo<FlowContextValue>(
		() => ({
			canvasGestures: canvas.list,
			connect,
			container,
			entries,
			finishConnection,
			fitView,
			getNodeRect,
			isLocked,
			isValidConnection,
			maxZoom,
			minZoom,
			notifyMeasured: fitWhenReady,
			notifyRegistry,
			onNodeDragEnd: handleNodeDragEnd,
			preview,
			registry,
			setLocked,
			viewport,
			zoomBy,
		}),
		[
			canvas.list,
			connect,
			container,
			entries,
			finishConnection,
			fitView,
			fitWhenReady,
			getNodeRect,
			handleNodeDragEnd,
			isLocked,
			isValidConnection,
			maxZoom,
			minZoom,
			notifyRegistry,
			preview,
			registry,
			viewport,
			zoomBy,
		]
	);

	const layerStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: viewport.value.x }, { translateY: viewport.value.y }, { scale: viewport.value.zoom }],
	}));

	const svgProps = useAnimatedProps<FlowMatrixGProps>(() => {
		const { x, y, zoom } = viewport.value;
		return { matrix: [zoom, 0, 0, zoom, x, y] };
	});

	const slots = flowVariants();
	const layers = sortLayers(children);

	return (
		<FlowProvider value={context}>
			<GestureDetector gesture={canvas.composed}>
				<View className={slots.root({ className })} onLayout={handleLayout} testID={testID}>
					<View
						accessibilityElementsHidden
						className="absolute inset-0"
						importantForAccessibility="no-hide-descendants"
						pointerEvents="none"
					>
						<Svg height="100%" width="100%">
							<AnimatedMatrixG animatedProps={svgProps}>
								<FlowSvgLayerProvider>{layers.svg}</FlowSvgLayerProvider>
							</AnimatedMatrixG>
						</Svg>
					</View>
					<Animated.View className={slots.layer()} pointerEvents="box-none" style={[LAYER_BOX, layerStyle]}>
						{layers.nodes}
					</Animated.View>
					<FlowConnectionPreview />
					{layers.overlay}
				</View>
			</GestureDetector>
		</FlowProvider>
	);
}

/** The node layer: `FLOW_LAYER_EXTENT` past the canvas on every side, centred on its origin. */
const LAYER_BOX = {
	height: FLOW_LAYER_EXTENT * 2,
	left: -FLOW_LAYER_EXTENT,
	top: -FLOW_LAYER_EXTENT,
	width: FLOW_LAYER_EXTENT * 2,
} as const;

/**
 * A pan-and-zoom canvas of nodes joined by edges — a pipeline, an org chart, an automation builder.
 *
 * The app owns the graph. Nodes, groups and edges are declared as children with the positions the
 * app holds; the canvas moves them on the UI thread while a finger does, then reports through
 * `onNodeDragEnd` and `onConnect` and never changes the graph itself.
 *
 * Children draw in three layers whatever order they are written in: `Flow.Background` and every
 * `Flow.Edge` in an SVG beneath the nodes; `Flow.Node` and `Flow.Group` in the transformed layer;
 * `Flow.Controls` and `Flow.MiniMap` on top, unscaled. Edges and backgrounds must be direct
 * children (or a `.map()` / fragment there) so the canvas can find them.
 *
 * @example
 * <Flow fitViewOnMount onNodeDragEnd={move} onConnect={addEdge}>
 *   <Flow.Background variant="dots" />
 *   <Flow.Node id="a" position={{ x: 0, y: 0 }}>
 *     <Card>…</Card>
 *     <Flow.Handle id="out" side="right" />
 *   </Flow.Node>
 *   <Flow.Node id="b" position={{ x: 260, y: 40 }}>
 *     <Card>…</Card>
 *     <Flow.Handle id="in" side="left" type="target" />
 *   </Flow.Node>
 *   <Flow.Edge from="a.out" to="b.in" variant="smoothstep" hasArrow />
 *   <Flow.Controls />
 *   <Flow.MiniMap />
 * </Flow>
 */
export const Flow = Object.assign(FlowRoot, {
	/** Dots, lines or crosses that pan and zoom with the graph. */
	Background: FlowBackground,
	/** Zoom, fit and lock buttons floating in a corner. */
	Controls: FlowControls,
	/** A line between two nodes, routed from where they are now. */
	Edge: FlowEdge,
	/** A labelled box whose nodes move with it. */
	Group: FlowGroup,
	/** A point on a node where edges attach and connections are dragged from. */
	Handle: FlowHandle,
	/** The whole graph in a corner, framing what is on screen. */
	MiniMap: FlowMiniMap,
	/** Any view, positioned in graph units and dragged on the UI thread. */
	Node: FlowNode,
	displayName: "DelacourUI.Flow",
});
