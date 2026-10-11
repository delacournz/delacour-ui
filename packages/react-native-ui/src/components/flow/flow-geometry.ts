/** A point in graph units — layout points at zoom 1. */
export type FlowPoint = { x: number; y: number };
export type FlowSize = { width: number; height: number };
export type FlowRect = FlowPoint & FlowSize;
/** Where the graph's origin lands on screen, and how far it is scaled. */
export type FlowViewport = { x: number; y: number; zoom: number };

export const FLOW_SIDES = ["top", "right", "bottom", "left"] as const;
export type FlowSide = (typeof FLOW_SIDES)[number];

export const FLOW_EDGE_VARIANTS = ["bezier", "smoothstep", "step", "straight"] as const;
export type FlowEdgeVariant = (typeof FLOW_EDGE_VARIANTS)[number];

export const FLOW_HANDLE_TYPES = ["source", "target", "both"] as const;
export type FlowHandleType = (typeof FLOW_HANDLE_TYPES)[number];

/** `"nodeId"`, or `"nodeId.handleId"`. */
export type FlowEndpointReference = string;
export type FlowEndpoint = { nodeId: string; handleId?: string };
/** One edge the app is asked to add. The canvas never adds it itself. */
export type FlowConnection = { source: string; sourceHandle?: string; target: string; targetHandle?: string };

/** Where a handle sits on its node: a side, and how far along it from 0 to 1. */
export type FlowHandlePlacement = { side: FlowSide; offset: number };

export type FlowEdgeGeometryInput = {
	sourceRect: FlowRect;
	targetRect: FlowRect;
	sourceHandle?: FlowHandlePlacement;
	targetHandle?: FlowHandlePlacement;
	/** Overrides the handle's side and the automatic one. */
	fromSide?: FlowSide;
	toSide?: FlowSide;
	variant: FlowEdgeVariant;
	gap: number;
	radius: number;
	curvature: number;
	/** `0` draws no head. */
	arrowSize: number;
};

export type FlowEdgeGeometry = {
	/** The line's SVG path. */
	d: string;
	/** The head's SVG path, or `""`. */
	arrow: string;
	start: FlowPoint;
	end: FlowPoint;
	/** The unit vector the line arrives along — what the head points down. */
	direction: FlowPoint;
	fromSide: FlowSide;
	toSide: FlowSide;
};

/**
 * Every piece of geometry the canvas draws, as one worklet.
 *
 * **One module-scope worklet, and every helper declared inside it.** A worklet at module scope
 * that calls a sibling captures that sibling when its own definition runs, in source order — and
 * the UI thread gets `undefined is not a function` the first time a finger moves a node, with a
 * stack naming neither. The charts engine learned that and enforces it by test; here the same rule
 * is kept by having nothing to call. A hook's worklet captures `flowGeometry` by ordinary closure
 * and calls it — `flowGeometry().resolveEdgeGeometry(…)` — which costs a handful of closures per
 * frame and nothing else.
 *
 * The same functions are destructured below as plain exports for the JS thread and the tests.
 * Those copies are **not** worklets: a hook's worklet must reach them through `flowGeometry()`.
 */
export function flowGeometry() {
	"worklet";

	function clamp(value: number, min: number, max: number): number {
		return value < min ? min : value > max ? max : value;
	}

	/** Rounded to two places, and never `-0`, so a path string stays short and stable. */
	function formatNumber(value: number): string {
		const rounded = Math.round(value * 100) / 100;
		return `${rounded === 0 ? 0 : rounded}`;
	}

	function point(at: FlowPoint): string {
		return `${formatNumber(at.x)} ${formatNumber(at.y)}`;
	}

	/** The unit vector pointing out of a side. */
	function sideVector(side: FlowSide): FlowPoint {
		if (side === "top") return { x: 0, y: -1 };
		if (side === "right") return { x: 1, y: 0 };
		if (side === "bottom") return { x: 0, y: 1 };
		return { x: -1, y: 0 };
	}

	function isHorizontalSide(side: FlowSide): boolean {
		return side === "left" || side === "right";
	}

	/**
	 * Which side each end leaves from when the edge names none: the axis on which the two centres
	 * are further apart wins, and a tie goes horizontal. The source leaves the side facing the
	 * target, and the target is entered on the opposite one.
	 */
	function resolveAutoSides(source: FlowRect, target: FlowRect): { source: FlowSide; target: FlowSide } {
		const dx = target.x + target.width / 2 - (source.x + source.width / 2);
		const dy = target.y + target.height / 2 - (source.y + source.height / 2);
		if (Math.abs(dx) >= Math.abs(dy)) {
			return dx >= 0 ? { source: "right", target: "left" } : { source: "left", target: "right" };
		}
		return dy >= 0 ? { source: "bottom", target: "top" } : { source: "top", target: "bottom" };
	}

	/** The point on a side of a rect, `offset` of the way along it, clamped to the side. */
	function resolveHandlePoint(rect: FlowRect, side: FlowSide, offset: number): FlowPoint {
		const along = clamp(offset, 0, 1);
		if (side === "top") return { x: rect.x + rect.width * along, y: rect.y };
		if (side === "right") return { x: rect.x + rect.width, y: rect.y + rect.height * along };
		if (side === "bottom") return { x: rect.x + rect.width * along, y: rect.y + rect.height };
		return { x: rect.x, y: rect.y + rect.height * along };
	}

	function routeStraight(from: FlowPoint, to: FlowPoint): string {
		return `M${point(from)} L${point(to)}`;
	}

	/**
	 * How far a bezier's control point reaches out of its side. Toward the other end it is a share
	 * of the distance; away from it, a square-root bow so a target behind the source loops round
	 * rather than kinking. Never under a small floor, so coincident ends still leave their sides.
	 */
	function controlReach(distance: number, curvature: number): number {
		const reach = distance > 0 ? distance * curvature * 2 : curvature * 25 * Math.sqrt(-distance);
		return Math.max(reach, curvature * 40);
	}

	function routeBezier(
		from: FlowPoint,
		fromSide: FlowSide,
		to: FlowPoint,
		toSide: FlowSide,
		curvature: number
	): string {
		const out = sideVector(fromSide);
		const into = sideVector(toSide);
		const fromReach = controlReach(out.x * (to.x - from.x) + out.y * (to.y - from.y), curvature);
		const toReach = controlReach(into.x * (from.x - to.x) + into.y * (from.y - to.y), curvature);
		const c1 = { x: from.x + out.x * fromReach, y: from.y + out.y * fromReach };
		const c2 = { x: to.x + into.x * toReach, y: to.y + into.y * toReach };
		return `M${point(from)} C${point(c1)} ${point(c2)} ${point(to)}`;
	}

	/** Whether `last` lies on the straight run from `before` to `next`, heading the same way. */
	function runsOn(before: FlowPoint, last: FlowPoint, next: FlowPoint): boolean {
		const isCollinear = (before.x === last.x && last.x === next.x) || (before.y === last.y && last.y === next.y);
		return isCollinear && (last.x - before.x) * (next.x - last.x) + (last.y - before.y) * (next.y - last.y) > 0;
	}

	/** Drops repeated points, and the middle of any three that run on in one direction. */
	function simplify(points: FlowPoint[]): FlowPoint[] {
		const result: FlowPoint[] = [];
		for (const next of points) {
			const last = result[result.length - 1];
			const before = result[result.length - 2];
			if (last !== undefined && last.x === next.x && last.y === next.y) continue;
			if (before !== undefined && last !== undefined && runsOn(before, last, next)) result[result.length - 1] = next;
			else result.push(next);
		}
		return result;
	}

	/** Mirrors a point across the diagonal, which turns a vertical route into a horizontal one. */
	function transpose(at: FlowPoint): FlowPoint {
		return { x: at.y, y: at.x };
	}

	/** Two horizontal sides: facing ends turn halfway across, same-way ends wrap the outer one. */
	function horizontalPair(from: FlowPoint, out: FlowPoint, to: FlowPoint, into: FlowPoint, gap: number): FlowPoint[] {
		if (out.x * (to.x - from.x) > 0 && into.x * (from.x - to.x) > 0) {
			const midX = (from.x + to.x) / 2;
			return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
		}
		const s = { x: from.x + out.x * gap, y: from.y };
		const e = { x: to.x + into.x * gap, y: to.y };
		if (out.x === into.x) {
			const x = out.x > 0 ? Math.max(s.x, e.x) : Math.min(s.x, e.x);
			return [from, { x, y: from.y }, { x, y: to.y }, to];
		}
		const midY = (from.y + to.y) / 2;
		return [from, s, { x: s.x, y: midY }, { x: e.x, y: midY }, e, to];
	}

	/** A horizontal side into a vertical one: one turn at the shared corner when it is ahead of both. */
	function horizontalToVertical(
		from: FlowPoint,
		out: FlowPoint,
		to: FlowPoint,
		into: FlowPoint,
		gap: number
	): FlowPoint[] {
		if (out.x * (to.x - from.x) > 0 && into.y * (from.y - to.y) > 0) return [from, { x: to.x, y: from.y }, to];
		const s = { x: from.x + out.x * gap, y: from.y };
		const e = { x: to.x, y: to.y + into.y * gap };
		return [from, s, { x: s.x, y: e.y }, e, to];
	}

	/**
	 * The corners of an orthogonal route. Two facing ends turn halfway across; a perpendicular pair
	 * turns once at the corner they share; anything else steps `gap` out of each side first, so the
	 * line never leaves a node backwards through itself. A route that starts vertically is the
	 * horizontal one mirrored across the diagonal, so each shape is written once.
	 */
	function stepPoints(from: FlowPoint, fromSide: FlowSide, to: FlowPoint, toSide: FlowSide, gap: number): FlowPoint[] {
		const out = sideVector(fromSide);
		const into = sideVector(toSide);
		const isHorizontal = isHorizontalSide(fromSide);
		const route = isHorizontalSide(toSide) === isHorizontal ? horizontalPair : horizontalToVertical;
		if (isHorizontal) return simplify(route(from, out, to, into, gap));
		return simplify(route(transpose(from), transpose(out), transpose(to), transpose(into), gap).map(transpose));
	}

	/** Straight segments through `points`, each corner rounded by up to `radius`. */
	function polylinePath(points: FlowPoint[], radius: number): string {
		const first = points[0];
		if (first === undefined) return "";
		let d = `M${point(first)}`;
		for (let index = 1; index < points.length; index += 1) {
			const corner = points[index] as FlowPoint;
			const next = points[index + 1];
			if (next === undefined || radius <= 0) {
				d += ` L${point(corner)}`;
				continue;
			}
			const previous = points[index - 1] as FlowPoint;
			const lengthIn = Math.hypot(corner.x - previous.x, corner.y - previous.y);
			const lengthOut = Math.hypot(next.x - corner.x, next.y - corner.y);
			const r = Math.min(radius, lengthIn / 2, lengthOut / 2);
			const enter = {
				x: corner.x - ((corner.x - previous.x) / (lengthIn || 1)) * r,
				y: corner.y - ((corner.y - previous.y) / (lengthIn || 1)) * r,
			};
			const leave = {
				x: corner.x + ((next.x - corner.x) / (lengthOut || 1)) * r,
				y: corner.y + ((next.y - corner.y) / (lengthOut || 1)) * r,
			};
			d += ` L${point(enter)} Q${point(corner)} ${point(leave)}`;
		}
		return d;
	}

	function routeStep(from: FlowPoint, fromSide: FlowSide, to: FlowPoint, toSide: FlowSide, gap: number): string {
		return polylinePath(stepPoints(from, fromSide, to, toSide, gap), 0);
	}

	function routeSmoothStep(
		from: FlowPoint,
		fromSide: FlowSide,
		to: FlowPoint,
		toSide: FlowSide,
		gap: number,
		radius: number
	): string {
		return polylinePath(stepPoints(from, fromSide, to, toSide, gap), radius);
	}

	/** A closed triangle with its tip on `end`, pointing down `direction`, `size` long. */
	function arrowHeadPath(end: FlowPoint, direction: FlowPoint, size: number): string {
		const length = Math.hypot(direction.x, direction.y);
		const unit = length === 0 ? { x: 1, y: 0 } : { x: direction.x / length, y: direction.y / length };
		const base = { x: end.x - unit.x * size, y: end.y - unit.y * size };
		const half = size * 0.6;
		const normal = { x: 0 - unit.y, y: unit.x };
		const left = { x: base.x - normal.x * half, y: base.y - normal.y * half };
		const right = { x: base.x + normal.x * half, y: base.y + normal.y * half };
		return `M${point(end)} L${point(left)} L${point(right)} Z`;
	}

	/** The line between two resolved ends, in the edge's variant. */
	function routePath(
		input: FlowEdgeGeometryInput,
		start: FlowPoint,
		fromSide: FlowSide,
		end: FlowPoint,
		toSide: FlowSide
	): string {
		if (input.variant === "straight") return routeStraight(start, end);
		if (input.variant === "step") return routeStep(start, fromSide, end, toSide, input.gap);
		if (input.variant === "smoothstep") return routeSmoothStep(start, fromSide, end, toSide, input.gap, input.radius);
		return routeBezier(start, fromSide, end, toSide, input.curvature);
	}

	/** Along the line for a straight edge; into the target's side for every other. */
	function arrivalDirection(variant: FlowEdgeVariant, start: FlowPoint, end: FlowPoint, toSide: FlowSide): FlowPoint {
		if (variant !== "straight") {
			const into = sideVector(toSide);
			return { x: 0 - into.x, y: 0 - into.y };
		}
		const length = Math.hypot(end.x - start.x, end.y - start.y);
		return length === 0 ? { x: 1, y: 0 } : { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
	}

	/**
	 * Both ends of an edge, its path and its head, from where the two nodes are now. An explicit
	 * side beats the handle's, which beats the automatic one. `null` while either node is still
	 * unmeasured, so an edge never draws from a garbage rect on its first frame.
	 */
	function resolveEdgeGeometry(input: FlowEdgeGeometryInput): FlowEdgeGeometry | null {
		const { sourceRect, targetRect } = input;
		const isUnmeasured = (rect: FlowRect) => rect.width === 0 && rect.height === 0;
		if (isUnmeasured(sourceRect) || isUnmeasured(targetRect)) return null;

		const auto = resolveAutoSides(sourceRect, targetRect);
		const fromSide = input.fromSide ?? input.sourceHandle?.side ?? auto.source;
		const toSide = input.toSide ?? input.targetHandle?.side ?? auto.target;
		const start = resolveHandlePoint(sourceRect, fromSide, input.sourceHandle?.offset ?? 0.5);
		const end = resolveHandlePoint(targetRect, toSide, input.targetHandle?.offset ?? 0.5);

		const d = routePath(input, start, fromSide, end, toSide);
		const direction = arrivalDirection(input.variant, start, end, toSide);
		const arrow = input.arrowSize > 0 ? arrowHeadPath(end, direction, input.arrowSize) : "";
		return { arrow, d, direction, end, fromSide, start, toSide };
	}

	/** The smallest rect holding every one given, or `null` for none. */
	function unionRects(rects: readonly FlowRect[]): FlowRect | null {
		const first = rects[0];
		if (first === undefined) return null;
		let minX = first.x;
		let minY = first.y;
		let maxX = first.x + first.width;
		let maxY = first.y + first.height;
		for (const rect of rects) {
			minX = Math.min(minX, rect.x);
			minY = Math.min(minY, rect.y);
			maxX = Math.max(maxX, rect.x + rect.width);
			maxY = Math.max(maxY, rect.y + rect.height);
		}
		return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}

	/**
	 * The viewport that centres `bounds` in the container with `padding` on every side. Never
	 * magnifies past one to one — fitting a single small node would otherwise blow it up to the
	 * maximum zoom — and never leaves the zoom limits.
	 */
	function fitViewport(input: {
		bounds: FlowRect | null;
		container: FlowSize;
		padding: number;
		minZoom: number;
		maxZoom: number;
	}): FlowViewport {
		const { bounds, container, padding, minZoom, maxZoom } = input;
		if (bounds === null) return { x: 0, y: 0, zoom: 1 };
		const availableWidth = container.width - padding * 2;
		const availableHeight = container.height - padding * 2;
		const fit =
			availableWidth <= 0 || availableHeight <= 0
				? minZoom
				: Math.min(
						bounds.width > 0 ? availableWidth / bounds.width : Number.POSITIVE_INFINITY,
						bounds.height > 0 ? availableHeight / bounds.height : Number.POSITIVE_INFINITY,
						1
					);
		const zoom = clamp(fit, minZoom, maxZoom);
		return {
			x: container.width / 2 - (bounds.x + bounds.width / 2) * zoom,
			y: container.height / 2 - (bounds.y + bounds.height / 2) * zoom,
			zoom,
		};
	}

	/** Scales by `factor` about a screen point, which stays where it is. */
	function zoomAround(
		viewport: FlowViewport,
		factor: number,
		focal: FlowPoint,
		minZoom: number,
		maxZoom: number
	): FlowViewport {
		const zoom = clamp(viewport.zoom * factor, minZoom, maxZoom);
		const ratio = zoom / viewport.zoom;
		return { x: focal.x - (focal.x - viewport.x) * ratio, y: focal.y - (focal.y - viewport.y) * ratio, zoom };
	}

	function screenToGraph(at: FlowPoint, viewport: FlowViewport): FlowPoint {
		return { x: (at.x - viewport.x) / viewport.zoom, y: (at.y - viewport.y) / viewport.zoom };
	}

	function graphToScreen(at: FlowPoint, viewport: FlowViewport): FlowPoint {
		return { x: at.x * viewport.zoom + viewport.x, y: at.y * viewport.zoom + viewport.y };
	}

	/** The part of the graph the container shows. */
	function visibleGraphRect(viewport: FlowViewport, container: FlowSize): FlowRect {
		return {
			x: (0 - viewport.x) / viewport.zoom,
			y: (0 - viewport.y) / viewport.zoom,
			width: container.width / viewport.zoom,
			height: container.height / viewport.zoom,
		};
	}

	/** A node's position, moved the least distance that keeps it inside `bounds`. */
	function clampPositionToRect(position: FlowPoint, size: FlowSize, bounds: FlowRect): FlowPoint {
		return {
			x: clamp(position.x, bounds.x, Math.max(bounds.x, bounds.x + bounds.width - size.width)),
			y: clamp(position.y, bounds.y, Math.max(bounds.y, bounds.y + bounds.height - size.height)),
		};
	}

	/** Scale and offset that fit `bounds` into a `width` × `height` map, centred, inside `padding`. */
	function miniMapTransform(
		bounds: FlowRect,
		width: number,
		height: number,
		padding: number
	): { scale: number; x: number; y: number } {
		const fitX = bounds.width > 0 ? (width - padding * 2) / bounds.width : Number.POSITIVE_INFINITY;
		const fitY = bounds.height > 0 ? (height - padding * 2) / bounds.height : Number.POSITIVE_INFINITY;
		const fit = Math.min(fitX, fitY);
		const scale = Number.isFinite(fit) && fit > 0 ? fit : 1;
		return {
			scale,
			x: (width - bounds.width * scale) / 2 - bounds.x * scale,
			y: (height - bounds.height * scale) / 2 - bounds.y * scale,
		};
	}

	return {
		arrowHeadPath,
		clampPositionToRect,
		fitViewport,
		graphToScreen,
		miniMapTransform,
		resolveAutoSides,
		resolveEdgeGeometry,
		resolveHandlePoint,
		routeBezier,
		routeSmoothStep,
		routeStep,
		routeStraight,
		screenToGraph,
		sideVector,
		stepPoints,
		unionRects,
		visibleGraphRect,
		zoomAround,
	};
}

export type FlowGeometry = ReturnType<typeof flowGeometry>;

/** JS-thread copies of {@link flowGeometry}'s helpers. Not worklets — see its doc comment. */
export const {
	arrowHeadPath,
	clampPositionToRect,
	fitViewport,
	graphToScreen,
	miniMapTransform,
	resolveAutoSides,
	resolveEdgeGeometry,
	resolveHandlePoint,
	routeBezier,
	routeSmoothStep,
	routeStep,
	routeStraight,
	screenToGraph,
	sideVector,
	stepPoints,
	unionRects,
	visibleGraphRect,
	zoomAround,
} = flowGeometry();

/**
 * `"a.out"` → `{ nodeId: "a", handleId: "out" }`. Only the first dot splits, so a handle id may
 * itself hold dots; a node id may not. JS thread only — an edge parses its ends once per render.
 */
export function parseEndpoint(reference: FlowEndpointReference): FlowEndpoint {
	const dot = reference.indexOf(".");
	if (dot === -1) return { nodeId: reference };
	const handleId = reference.slice(dot + 1);
	return handleId === "" ? { nodeId: reference.slice(0, dot) } : { handleId, nodeId: reference.slice(0, dot) };
}

/**
 * The candidate nearest `at` within `radius`, or `null`. JS thread only — a connection is hit
 * tested once, on release.
 */
export function findHandleAt<T extends { point: FlowPoint }>(
	at: FlowPoint,
	candidates: readonly T[],
	radius: number
): T | null {
	let best: T | null = null;
	let bestDistance = radius;
	for (const candidate of candidates) {
		const distance = Math.hypot(candidate.point.x - at.x, candidate.point.y - at.y);
		if (distance <= bestDistance) {
			best = candidate;
			bestDistance = distance;
		}
	}
	return best;
}
