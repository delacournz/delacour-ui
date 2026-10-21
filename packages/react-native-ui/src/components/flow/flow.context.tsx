import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import type { GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { FlowHandleRef } from "./flow.variants";
import type { FlowConnection, FlowPoint, FlowRect, FlowSide, FlowSize, FlowViewport } from "./flow-geometry";
import type { FlowRegistry, FlowRegistryEntry, FlowSnapshotEntry } from "./flow-registry";

/** The line drawn from a handle to the finger while a connection is dragged. */
export type FlowConnectionPreview = { isActive: boolean; from: FlowPoint; fromSide: FlowSide; to: FlowPoint };

export type FlowContextValue = {
	registry: FlowRegistry;
	/** The mounted nodes and groups, rebuilt whenever one mounts, unmounts or changes a handle. */
	entries: readonly FlowSnapshotEntry[];
	/** Re-reads the registry into `entries`. Called from a part's effects. */
	notifyRegistry: () => void;
	/** A node has a size. Once every node does, `fitViewOnMount` fits. */
	notifyMeasured: () => void;
	viewport: SharedValue<FlowViewport>;
	container: SharedValue<FlowSize>;
	preview: SharedValue<FlowConnectionPreview>;
	minZoom: number;
	maxZoom: number;
	isLocked: boolean;
	setLocked: (isLocked: boolean) => void;
	/** The canvas's own gestures, which every node and handle gesture blocks. */
	canvasGestures: readonly GestureType[];
	fitView: (options?: { isAnimated?: boolean }) => void;
	zoomBy: (factor: number) => void;
	getNodeRect: (id: string) => FlowRect | null;
	/** Hit tests a released connection drag and, if it lands on a handle that accepts it, connects. */
	finishConnection: (from: FlowHandleRef, at: FlowPoint) => void;
	/** Validates a connection through the app's `isValidConnection` and calls `onConnect`. */
	connect: (connection: FlowConnection) => boolean;
	isValidConnection?: (connection: FlowConnection) => boolean;
	onNodeDragEnd: (id: string, position: FlowPoint) => void;
};

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ value, children }: { value: FlowContextValue; children: ReactNode }): ReactElement {
	return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}
FlowProvider.displayName = "DelacourUI.Flow.Provider";

/** The canvas's context, or `null` outside a `<Flow>`. */
export function useFlowContext(): FlowContextValue | null {
	return useContext(FlowContext);
}

/** The canvas's context for a part, which throws by name outside a `<Flow>`. */
export function useFlowPart(part: string): FlowContextValue {
	const context = useContext(FlowContext);
	if (!context) throw new Error(`<${part}> must be rendered inside a <Flow>.`);
	return context;
}

export type UseFlowResult = {
	/** The pan and zoom, on the UI thread. Read it in a worklet; write it to move the canvas. */
	viewport: SharedValue<FlowViewport>;
	/** Frames every node, animated unless reduce motion is on. */
	fitView: () => void;
	/** Zooms about the canvas's centre — `zoomBy(1.3)` in, `zoomBy(1 / 1.3)` out. */
	zoomBy: (factor: number) => void;
	isLocked: boolean;
	/** Locks pan, zoom and every drag. */
	setLocked: (isLocked: boolean) => void;
	/** Where a node or group is now, in graph units, or `null` before it has measured. */
	getNodeRect: (id: string) => FlowRect | null;
};

/**
 * The canvas from inside it — for a custom control, an overlay, or a node that wants to frame
 * itself. Throws outside a `<Flow>`.
 */
export function useFlow(): UseFlowResult {
	const { viewport, fitView, zoomBy, isLocked, setLocked, getNodeRect } = useFlowPart("useFlow");
	return { fitView: () => fitView(), getNodeRect, isLocked, setLocked, viewport, zoomBy };
}

/**
 * What a part drawing on the Skia canvas cannot look up for itself.
 *
 * `<Canvas>` is a second React reconciler, so a theme hook or `useCalmMotion` called inside it
 * reads no provider from the app — no `ScopedTheme`, no `CalmMotionProvider`. The root resolves
 * both above the canvas and re-provides them here, beside a re-rendered `FlowProvider`.
 */
export type FlowCanvasLayerValue = {
	/** Every colour token the canvas's children name, resolved against the app's theme. */
	colors: Readonly<Record<string, string | undefined>>;
	isCalm: boolean;
};

const FlowCanvasLayerContext = createContext<FlowCanvasLayerValue | null>(null);

export function FlowCanvasLayerProvider({
	value,
	children,
}: {
	value: FlowCanvasLayerValue;
	children: ReactNode;
}): ReactElement {
	return <FlowCanvasLayerContext.Provider value={value}>{children}</FlowCanvasLayerContext.Provider>;
}
FlowCanvasLayerProvider.displayName = "DelacourUI.Flow.CanvasLayerProvider";

/** The canvas layer's values, or `null` outside it — the only place an edge or a background can draw. */
export function useFlowCanvasLayer(): FlowCanvasLayerValue | null {
	return useContext(FlowCanvasLayerContext);
}

export type FlowGroupContextValue = { id: string; entry: FlowRegistryEntry };

const FlowGroupContext = createContext<FlowGroupContextValue | null>(null);

export function FlowGroupProvider({
	value,
	children,
}: {
	value: FlowGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <FlowGroupContext.Provider value={value}>{children}</FlowGroupContext.Provider>;
}
FlowGroupProvider.displayName = "DelacourUI.Flow.Group.Provider";

/** The group a node sits in, or `null`. */
export function useFlowGroup(): FlowGroupContextValue | null {
	return useContext(FlowGroupContext);
}

export type FlowNodeContextValue = {
	id: string;
	entry: FlowRegistryEntry;
	/** The node's drag, which a handle's gesture blocks so a connection drag never moves the node. */
	nodeGesture: GestureType;
	/** Re-reads the node's handles into the canvas. */
	notifyHandles: () => void;
};

const FlowNodeContext = createContext<FlowNodeContextValue | null>(null);

export function FlowNodeProvider({
	value,
	children,
}: {
	value: FlowNodeContextValue;
	children: ReactNode;
}): ReactElement {
	return <FlowNodeContext.Provider value={value}>{children}</FlowNodeContext.Provider>;
}
FlowNodeProvider.displayName = "DelacourUI.Flow.Node.Provider";

/** The node a handle sits on. Throws by name outside a `<Flow.Node>`. */
export function useFlowNode(part: string): FlowNodeContextValue {
	const context = useContext(FlowNodeContext);
	if (!context) throw new Error(`<${part}> must be rendered inside a <Flow.Node>.`);
	return context;
}
