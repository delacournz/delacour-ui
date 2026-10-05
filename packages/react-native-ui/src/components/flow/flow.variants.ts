import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { FlowConnection, FlowHandleType, FlowPoint, FlowSide } from "./flow-geometry";

/** Every default the API documents, in one place the tests pin. */
export const FLOW_DEFAULTS = {
	accessibilityMoveStep: 24,
	backgroundGap: 24,
	backgroundSize: 1.6,
	/** How close, in graph units, a released connection has to land to a handle. */
	connectRadius: 20,
	controlsStep: 1.3,
	/** A node drag starts after this much travel, so a tap is still a tap. */
	dragMinDistance: 4,
	edgeCurvature: 0.25,
	edgeGap: 20,
	edgeRadius: 8,
	edgeWidth: 2,
	fitDuration: 300,
	fitViewPadding: 48,
	handleOffset: 0.5,
	maxZoom: 2.5,
	miniMapHeight: 84,
	/** Space between the map's edge and the graph drawn in it. */
	miniMapPadding: 6,
	miniMapWidth: 120,
	minZoom: 0.3,
	/** One cycle of an animated edge's dashes, in ms. */
	dashDuration: 500,
} as const;

/** A handle's edge length in points — the `size-3` on its slot, which a test holds together. */
export const FLOW_HANDLE_SIZE = 12;

/**
 * Half the node layer's edge, in points. The layer is laid out this far past the canvas on every
 * side and the graph's origin sits at its centre, so every node is inside its parent's bounds and
 * a touch on one is delivered — a node translated outside a zero-size parent draws, but on some
 * platforms is never hit tested. An empty view this size allocates no backing store.
 */
export const FLOW_LAYER_EXTENT = 50000;

/** How far past its box a handle still takes a touch. */
export const FLOW_HANDLE_HIT_SLOP = 12;

export const FLOW_BACKGROUND_VARIANTS = ["dots", "lines", "cross", "none"] as const;
export type FlowBackgroundVariant = (typeof FLOW_BACKGROUND_VARIANTS)[number];

export const FLOW_MINIMAP_CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type FlowMiniMapCorner = (typeof FLOW_MINIMAP_CORNERS)[number];

export const FLOW_CONTROL_LABELS = {
	fit: "Fit to view",
	lock: "Lock canvas",
	zoomIn: "Zoom in",
	zoomOut: "Zoom out",
} as const;

export const flowVariants = tv({
	slots: {
		root: "relative flex-1 overflow-hidden bg-background",
		layer: "absolute top-0 left-0",
		node: "absolute top-0 left-0",
		selection: "absolute -inset-1 rounded-xl border-2 border-primary",
		handle: "absolute top-0 left-0 size-3 rounded-full border-2 border-primary bg-background",
		group: "absolute top-0 left-0 rounded-lg border border-border border-dashed bg-muted/40",
		groupLabel: "absolute top-2 left-2 rounded-md px-2 py-0.5",
		controls: "absolute bottom-3 left-3 gap-1 rounded-lg p-1",
		miniMap: "absolute overflow-hidden rounded-lg",
	},
	variants: {
		isHandleHidden: {
			true: { handle: "opacity-0" },
			false: {},
		},
		miniMapCorner: {
			"top-left": { miniMap: "top-3 left-3" },
			"top-right": { miniMap: "top-3 right-3" },
			"bottom-left": { miniMap: "bottom-3 left-3" },
			"bottom-right": { miniMap: "right-3 bottom-3" },
		},
	},
	defaultVariants: {
		isHandleHidden: false,
		miniMapCorner: "bottom-right",
	},
});

export type FlowVariantProps = VariantProps<typeof flowVariants>;

function clampUnit(value: number): number {
	return value < 0 ? 0 : value > 1 ? 1 : value;
}

export type FlowHandleStyle = {
	left: number | `${number}%`;
	top: number | `${number}%`;
	marginLeft: number;
	marginTop: number;
};

/**
 * Where a handle sits inside its node's box: centred on the side, `offset` of the way along it.
 * Percentages rather than measured points, so a handle needs no layout pass of its own and stays
 * put when its node changes size.
 */
export function resolveHandleStyle(side: FlowSide, offset: number): FlowHandleStyle {
	const along = `${clampUnit(offset) * 100}%` as const;
	const half = -FLOW_HANDLE_SIZE / 2;
	const margins = { marginLeft: half, marginTop: half };
	if (side === "top") return { ...margins, left: along, top: 0 };
	if (side === "right") return { ...margins, left: "100%", top: along };
	if (side === "bottom") return { ...margins, left: along, top: "100%" };
	return { ...margins, left: 0, top: along };
}

/** One tile of the background, in graph units. */
export type FlowBackgroundPattern =
	| { kind: "none" }
	| { kind: "dots"; tile: number; cx: number; cy: number; r: number }
	| { kind: "lines"; tile: number; d: string; strokeWidth: number }
	| { kind: "cross"; tile: number; d: string; strokeWidth: number };

/**
 * The tile the background repeats. `size` is the mark's weight: a dot's radius, and twice a line's
 * or a cross's stroke. Lines trace two edges of each tile so neighbours join into a grid.
 */
export function resolveBackgroundPattern(
	variant: FlowBackgroundVariant,
	gap: number,
	size: number
): FlowBackgroundPattern {
	if (variant === "none" || gap < 1) return { kind: "none" };
	const centre = gap / 2;
	if (variant === "dots") return { cx: centre, cy: centre, kind: "dots", r: size, tile: gap };
	if (variant === "lines") return { d: `M0 0 H${gap} M0 0 V${gap}`, kind: "lines", strokeWidth: size / 2, tile: gap };
	const arm = gap / 4;
	return {
		d: `M${centre - arm} ${centre} H${centre + arm} M${centre} ${centre - arm} V${centre + arm}`,
		kind: "cross",
		strokeWidth: size / 2,
		tile: gap,
	};
}

/** An arrowhead is four strokes long, and never smaller than six points. */
export function resolveArrowSize(width: number, hasArrow: boolean): number {
	return hasArrow ? Math.max(6, width * 4) : 0;
}

/**
 * The dash pattern, scaled with the stroke so a thick edge does not read as dotted, and how far
 * one march cycle moves. An animated edge is always dashed — a solid line has nothing to march.
 */
export function resolveEdgeDash({
	isDashed,
	isAnimated,
	width,
}: {
	isDashed: boolean;
	isAnimated: boolean;
	width: number;
}): { dashArray?: number[]; cycle: number } {
	if (!isDashed && !isAnimated) return { cycle: 0 };
	return { cycle: width * 5, dashArray: [width * 3, width * 2] };
}

export type FlowHandleRef = { nodeId: string; handleId: string; type: FlowHandleType };

function canBeSource(type: FlowHandleType): boolean {
	return type === "source" || type === "both";
}

function canBeTarget(type: FlowHandleType): boolean {
	return type === "target" || type === "both";
}

/**
 * The connection a drag from one handle to another asks for, or `null`. A drag may start at either
 * end: from a target handle it is read backwards. `both` reads as a source first. A node never
 * connects to itself. The app's `isValidConnection` is asked after this, never instead of it.
 */
export function resolveDraggedConnection(from: FlowHandleRef, to: FlowHandleRef): FlowConnection | null {
	if (from.nodeId === to.nodeId) return null;
	const forward = { source: from.nodeId, sourceHandle: from.handleId, target: to.nodeId, targetHandle: to.handleId };
	const backward = { source: to.nodeId, sourceHandle: to.handleId, target: from.nodeId, targetHandle: from.handleId };
	if (canBeSource(from.type) && canBeTarget(to.type)) return forward;
	if (canBeTarget(from.type) && canBeSource(to.type)) return backward;
	return null;
}

/** The four assistive moves, in the order a rotor lists them. */
export const FLOW_ACCESSIBILITY_MOVES = [
	{ dx: 0, dy: -1, label: "Move up", name: "moveUp" },
	{ dx: 0, dy: 1, label: "Move down", name: "moveDown" },
	{ dx: -1, dy: 0, label: "Move left", name: "moveLeft" },
	{ dx: 1, dy: 0, label: "Move right", name: "moveRight" },
] as const;

/** How far an assistive move action shifts a node, or `null` for any other action. */
export function resolveAccessibilityMove(actionName: string, step: number): FlowPoint | null {
	const move = FLOW_ACCESSIBILITY_MOVES.find((candidate) => candidate.name === actionName);
	return move ? { x: move.dx * step, y: move.dy * step } : null;
}

/**
 * Whether a node takes its own drag, and whether it moves with its group. `isPinned` keeps a node
 * where it sits inside its group — the group still carries it. `isDraggable={false}` keeps it
 * where it sits on the canvas, group or no group. A locked canvas drags nothing.
 */
export function resolveNodeDrag({
	isDraggable,
	isPinned,
	isLocked,
}: {
	isDraggable: boolean;
	isPinned: boolean;
	isLocked: boolean;
}): { canDrag: boolean; ridesGroup: boolean } {
	return { canDrag: isDraggable && !isPinned && !isLocked, ridesGroup: isDraggable };
}

export type FlowAccessibilityHandle = { id: string; type: FlowHandleType; label?: string };
export type FlowAccessibilityNode = { id: string; label: string; handles: readonly FlowAccessibilityHandle[] };
export type FlowAccessibilityAction = { name: string; label: string };

/** The handle's spoken name — its label, its id, or nothing for the unnamed default. */
function handleName(handle: FlowAccessibilityHandle): string | null {
	if (handle.label !== undefined) return handle.label;
	return handle.id === "default" ? null : handle.id;
}

/** "Connect out to Merge, first input" — the handle and the target's handle only when they say something. */
function connectLabel(from: string | null, target: string, into: string | null): string {
	return `Connect${from ? ` ${from}` : ""} to ${target}${into ? `, ${into}` : ""}`;
}

/** Every connection this node can start, labelled the way a rotor reads it. */
function connectOptions(
	node: FlowAccessibilityNode,
	others: readonly FlowAccessibilityNode[],
	isValidConnection: ((connection: FlowConnection) => boolean) | undefined
): [string, FlowConnection][] {
	const sources = node.handles.filter((handle) => canBeSource(handle.type));
	return sources.flatMap((handle) =>
		others
			.filter((other) => other.id !== node.id)
			.flatMap((other) => {
				const targets = other.handles.filter((candidate) => canBeTarget(candidate.type));
				return targets.flatMap((target): [string, FlowConnection][] => {
					const connection = { source: node.id, sourceHandle: handle.id, target: other.id, targetHandle: target.id };
					if (isValidConnection?.(connection) === false) return [];
					const into = targets.length > 1 ? handleName(target) : null;
					return [[connectLabel(handleName(handle), other.label, into), connection]];
				});
			})
	);
}

/**
 * Every assistive action a node offers, and the connection each connect action stands for.
 *
 * Activate first, then the four moves, then one "Connect" per pairing of this node's source
 * handles with another node's target handles that the app's validator accepts, then delete. The
 * connect names are opaque indexes (`connect-0`) and `connections` maps them back, so an id with
 * a colon or a space never has to survive a round trip through an action name.
 */
export function resolveNodeAccessibilityActions({
	node,
	others,
	canActivate,
	canMove,
	canDelete,
	isValidConnection,
}: {
	node: FlowAccessibilityNode;
	others: readonly FlowAccessibilityNode[];
	canActivate: boolean;
	canMove: boolean;
	canDelete: boolean;
	isValidConnection?: (connection: FlowConnection) => boolean;
}): { actions: FlowAccessibilityAction[]; connections: Record<string, FlowConnection> } {
	const actions: FlowAccessibilityAction[] = [];
	const connections: Record<string, FlowConnection> = {};

	if (canActivate) actions.push({ label: "Select", name: "activate" });
	if (canMove) for (const move of FLOW_ACCESSIBILITY_MOVES) actions.push({ label: move.label, name: move.name });

	for (const [label, connection] of connectOptions(node, others, isValidConnection)) {
		const name = `connect-${Object.keys(connections).length}`;
		connections[name] = connection;
		actions.push({ label, name });
	}

	if (canDelete) actions.push({ label: "Delete", name: "delete" });
	return { actions, connections };
}
