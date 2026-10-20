import { describe, expect, test } from "bun:test";
import {
	collectFlowCanvasTokens,
	FLOW_ACCESSIBILITY_MOVES,
	FLOW_BACKGROUND_VARIANTS,
	FLOW_CONTROL_LABELS,
	FLOW_DEFAULTS,
	FLOW_HANDLE_SIZE,
	FLOW_MINIMAP_CORNERS,
	flowVariants,
	resolveAccessibilityMove,
	resolveArrowSize,
	resolveBackgroundPattern,
	resolveDraggedConnection,
	resolveEdgeDash,
	resolveFlowCanvasToken,
	resolveFlowChildLayer,
	resolveHandleStyle,
	resolveNodeAccessibilityActions,
	resolveNodeDrag,
} from "./flow.variants";
import { FLOW_HANDLE_TYPES, FLOW_SIDES, type FlowConnection } from "./flow-geometry";

describe("FLOW_DEFAULTS", () => {
	test("match the documented defaults", () => {
		expect(FLOW_DEFAULTS).toMatchObject({
			accessibilityMoveStep: 24,
			backgroundGap: 24,
			backgroundSize: 1.6,
			connectRadius: 20,
			controlsStep: 1.3,
			edgeCurvature: 0.25,
			edgeGap: 20,
			edgeRadius: 8,
			edgeWidth: 2,
			fitDuration: 300,
			fitViewPadding: 48,
			handleOffset: 0.5,
			maxZoom: 2.5,
			miniMapHeight: 84,
			miniMapWidth: 120,
			minZoom: 0.3,
		});
	});

	test("the zoom limits are ordered", () => {
		expect(FLOW_DEFAULTS.minZoom).toBeLessThan(1);
		expect(FLOW_DEFAULTS.maxZoom).toBeGreaterThan(1);
	});
});

describe("flowVariants", () => {
	test("the handle's class is the size the placement maths assumes", () => {
		const spacing: Record<string, number> = { "size-2": 8, "size-2.5": 10, "size-3": 12, "size-3.5": 14, "size-4": 16 };
		const sizeClass =
			flowVariants()
				.handle()
				.match(/\bsize-[\d.]+/)?.[0] ?? "";
		expect(spacing[sizeClass]).toBe(FLOW_HANDLE_SIZE);
	});

	test("a hidden handle keeps its box and draws nothing", () => {
		const hidden = flowVariants({ isHandleHidden: true }).handle();
		expect(hidden).toContain("opacity-0");
		expect(hidden).toMatch(/\bsize-/);
	});

	test("every minimap corner pins two edges", () => {
		for (const corner of FLOW_MINIMAP_CORNERS) {
			const [vertical, horizontal] = corner.split("-") as [string, string];
			const classes = flowVariants({ miniMapCorner: corner }).miniMap();
			expect(classes).toContain(`${vertical}-3`);
			expect(classes).toContain(`${horizontal}-3`);
		}
	});

	test("the canvas clips, so a panned graph never draws over the screen around it", () => {
		expect(flowVariants().root()).toContain("overflow-hidden");
	});

	test("caller classes merge last", () => {
		expect(flowVariants().root({ className: "bg-card" })).toContain("bg-card");
		expect(flowVariants().root({ className: "bg-card" })).not.toContain("bg-background");
	});

	test("semantic colours only", () => {
		const slots = flowVariants();
		const all = Object.values(slots)
			.map((slot) => slot())
			.join(" ");
		expect(all).not.toMatch(/\b(?:bg|border|text)-(?:white|black|zinc|gray|slate|neutral|red|blue)\b/);
		expect(all).not.toContain("dark:");
	});
});

describe("resolveHandleStyle", () => {
	test("centres the handle on the side at its offset", () => {
		const half = -FLOW_HANDLE_SIZE / 2;
		expect(resolveHandleStyle("top", 0.5)).toEqual({ left: "50%", marginLeft: half, marginTop: half, top: 0 });
		expect(resolveHandleStyle("right", 0.25)).toEqual({ left: "100%", marginLeft: half, marginTop: half, top: "25%" });
		expect(resolveHandleStyle("bottom", 1)).toEqual({ left: "100%", marginLeft: half, marginTop: half, top: "100%" });
		expect(resolveHandleStyle("left", 0)).toEqual({ left: 0, marginLeft: half, marginTop: half, top: "0%" });
	});

	test("clamps the offset", () => {
		expect(resolveHandleStyle("right", 3).top).toBe("100%");
		expect(resolveHandleStyle("right", -1).top).toBe("0%");
	});
});

describe("resolveBackgroundPattern", () => {
	test("every variant resolves", () => {
		for (const variant of FLOW_BACKGROUND_VARIANTS) {
			expect(resolveBackgroundPattern(variant, 24, 1.6).kind).toBe(variant);
		}
	});

	test("dots sit in the middle of each tile, `size` is their radius", () => {
		expect(resolveBackgroundPattern("dots", 24, 1.6)).toEqual({
			arm: 0,
			kind: "dots",
			shape: 0,
			tile: 24,
			weight: 1.6,
		});
	});

	test("lines run along the tile edges, half a stroke of `size / 2` either side", () => {
		expect(resolveBackgroundPattern("lines", 20, 2)).toEqual({
			arm: 0,
			kind: "lines",
			shape: 1,
			tile: 20,
			weight: 0.5,
		});
	});

	test("a cross is centred in its tile, each arm a quarter of the tile", () => {
		expect(resolveBackgroundPattern("cross", 24, 2)).toEqual({
			arm: 6,
			kind: "cross",
			shape: 2,
			tile: 24,
			weight: 0.5,
		});
	});

	test("a gap below one is drawn as none rather than a solid fill", () => {
		expect(resolveBackgroundPattern("dots", 0, 1.6).kind).toBe("none");
	});
});

describe("resolveFlowCanvasToken", () => {
	test("an edge defaults to muted-foreground, the background to border", () => {
		expect(resolveFlowCanvasToken("DelacourUI.Flow.Edge", undefined)).toBe("muted-foreground");
		expect(resolveFlowCanvasToken("DelacourUI.Flow.Background", undefined)).toBe("border");
	});

	test("an explicit colour wins", () => {
		expect(resolveFlowCanvasToken("DelacourUI.Flow.Edge", "#ff0000")).toBe("#ff0000");
	});

	test("anything else names no colour", () => {
		expect(resolveFlowCanvasToken("DelacourUI.Flow.Node", "primary")).toBeUndefined();
		expect(resolveFlowCanvasToken(undefined, undefined)).toBeUndefined();
	});
});

describe("collectFlowCanvasTokens", () => {
	test("deduplicated and sorted, so the lookup array is stable across renders", () => {
		expect(
			collectFlowCanvasTokens([
				{ color: undefined, displayName: "DelacourUI.Flow.Edge" },
				{ color: "primary", displayName: "DelacourUI.Flow.Edge" },
				{ color: undefined, displayName: "DelacourUI.Flow.Edge" },
				{ color: undefined, displayName: "DelacourUI.Flow.Background" },
				{ color: "primary", displayName: "DelacourUI.Flow.Node" },
			])
		).toEqual(["border", "muted-foreground", "primary"]);
	});

	test("empty for no canvas children", () => {
		expect(collectFlowCanvasTokens([])).toEqual([]);
	});
});

describe("resolveArrowSize", () => {
	test("scales with the stroke, with a floor", () => {
		expect(resolveArrowSize(2, true)).toBe(8);
		expect(resolveArrowSize(4, true)).toBe(16);
		expect(resolveArrowSize(0.5, true)).toBe(6);
	});

	test("is zero without an arrow", () => {
		expect(resolveArrowSize(2, false)).toBe(0);
	});
});

describe("resolveEdgeDash", () => {
	test("solid by default", () => {
		expect(resolveEdgeDash({ isAnimated: false, isDashed: false, width: 2 })).toEqual({ cycle: 0 });
	});

	test("a dashed edge scales its dash with the stroke", () => {
		expect(resolveEdgeDash({ isAnimated: false, isDashed: true, width: 2 })).toEqual({ cycle: 10, dashArray: [6, 4] });
	});

	test("an animated edge is dashed, so there is something to march", () => {
		expect(resolveEdgeDash({ isAnimated: true, isDashed: false, width: 2 })).toEqual({ cycle: 10, dashArray: [6, 4] });
	});
});

describe("resolveDraggedConnection", () => {
	const handle = (nodeId: string, type: (typeof FLOW_HANDLE_TYPES)[number], handleId = "default") => ({
		handleId,
		nodeId,
		type,
	});

	test("source to target goes forward", () => {
		expect(resolveDraggedConnection(handle("a", "source", "out"), handle("b", "target", "in"))).toEqual({
			source: "a",
			sourceHandle: "out",
			target: "b",
			targetHandle: "in",
		});
	});

	test("dragging back from a target reverses it", () => {
		expect(resolveDraggedConnection(handle("b", "target", "in"), handle("a", "source", "out"))).toEqual({
			source: "a",
			sourceHandle: "out",
			target: "b",
			targetHandle: "in",
		});
	});

	test("both reads as a source first, then as a target", () => {
		expect(resolveDraggedConnection(handle("a", "both"), handle("b", "both"))?.source).toBe("a");
		expect(resolveDraggedConnection(handle("a", "both"), handle("b", "source"))?.source).toBe("b");
	});

	test("two sources, or two targets, do not connect", () => {
		expect(resolveDraggedConnection(handle("a", "source"), handle("b", "source"))).toBeNull();
		expect(resolveDraggedConnection(handle("a", "target"), handle("b", "target"))).toBeNull();
	});

	test("a node never connects to itself", () => {
		expect(resolveDraggedConnection(handle("a", "source", "out"), handle("a", "target", "in"))).toBeNull();
	});

	test("every type pair resolves to a connection or null, never throws", () => {
		for (const from of FLOW_HANDLE_TYPES) {
			for (const to of FLOW_HANDLE_TYPES) {
				const result = resolveDraggedConnection(handle("a", from), handle("b", to));
				expect(result === null || (result.source !== result.target && typeof result.source === "string")).toBe(true);
			}
		}
	});
});

describe("resolveAccessibilityMove", () => {
	test("each move steps one way", () => {
		expect(resolveAccessibilityMove("moveUp", 24)).toEqual({ x: 0, y: -24 });
		expect(resolveAccessibilityMove("moveDown", 24)).toEqual({ x: 0, y: 24 });
		expect(resolveAccessibilityMove("moveLeft", 10)).toEqual({ x: -10, y: 0 });
		expect(resolveAccessibilityMove("moveRight", 10)).toEqual({ x: 10, y: 0 });
	});

	test("anything else is not a move", () => {
		expect(resolveAccessibilityMove("activate", 24)).toBeNull();
	});

	test("the four moves are labelled for a screen reader", () => {
		expect(FLOW_ACCESSIBILITY_MOVES.map((move) => move.label)).toEqual([
			"Move up",
			"Move down",
			"Move left",
			"Move right",
		]);
	});
});

describe("resolveNodeDrag", () => {
	test("a free node drags itself and rides its group", () => {
		expect(resolveNodeDrag({ isDraggable: true, isLocked: false, isPinned: false })).toEqual({
			canDrag: true,
			ridesGroup: true,
		});
	});

	test("a pinned node rides its group but cannot be dragged alone", () => {
		expect(resolveNodeDrag({ isDraggable: true, isLocked: false, isPinned: true })).toEqual({
			canDrag: false,
			ridesGroup: true,
		});
	});

	test("a node that is not draggable stays put", () => {
		expect(resolveNodeDrag({ isDraggable: false, isLocked: false, isPinned: false })).toEqual({
			canDrag: false,
			ridesGroup: false,
		});
	});

	test("a locked canvas drags nothing", () => {
		expect(resolveNodeDrag({ isDraggable: true, isLocked: true, isPinned: false }).canDrag).toBe(false);
	});
});

describe("resolveNodeAccessibilityActions", () => {
	const a = { handles: [{ id: "out", type: "source" as const }], id: "a", label: "Fetch" };
	const b = { handles: [{ id: "in", type: "target" as const }], id: "b", label: "Parse" };
	const c = {
		handles: [
			{ id: "left", label: "first input", type: "target" as const },
			{ id: "right", type: "both" as const },
		],
		id: "c",
		label: "Merge",
	};
	const base = { canActivate: false, canDelete: false, canMove: false, others: [b, c] };

	test("offers a connect for every target that accepts one", () => {
		const { actions, connections } = resolveNodeAccessibilityActions({ ...base, node: a });
		expect(actions.map((action) => action.label)).toEqual([
			"Connect out to Parse",
			"Connect out to Merge, first input",
			"Connect out to Merge, right",
		]);
		expect(Object.values(connections)).toContainEqual({
			source: "a",
			sourceHandle: "out",
			target: "c",
			targetHandle: "left",
		});
	});

	test("a default handle goes unnamed", () => {
		const node = { handles: [{ id: "default", type: "source" as const }], id: "x", label: "X" };
		const target = { handles: [{ id: "default", type: "target" as const }], id: "y", label: "Y" };
		const { actions } = resolveNodeAccessibilityActions({ ...base, node, others: [target] });
		expect(actions.map((action) => action.label)).toEqual(["Connect to Y"]);
	});

	test("the app's validator removes a connect", () => {
		const isValidConnection = (connection: FlowConnection) => connection.target !== "b";
		const { actions } = resolveNodeAccessibilityActions({ ...base, isValidConnection, node: a });
		expect(actions.some((action) => action.label.includes("Parse"))).toBe(false);
	});

	test("a target-only node offers no connects", () => {
		expect(resolveNodeAccessibilityActions({ ...base, node: b, others: [a] }).actions).toEqual([]);
	});

	test("activate, the moves and delete come with their flags, in that order around the connects", () => {
		const { actions } = resolveNodeAccessibilityActions({
			...base,
			canActivate: true,
			canDelete: true,
			canMove: true,
			node: a,
			others: [b],
		});
		expect(actions.map((action) => action.name)).toEqual([
			"activate",
			"moveUp",
			"moveDown",
			"moveLeft",
			"moveRight",
			"connect-0",
			"delete",
		]);
	});

	test("connect names map back to their connections", () => {
		const { actions, connections } = resolveNodeAccessibilityActions({ ...base, node: a, others: [b] });
		const name = actions[0]?.name ?? "";
		expect(connections[name]).toEqual({ source: "a", sourceHandle: "out", target: "b", targetHandle: "in" });
	});
});

describe("FLOW_CONTROL_LABELS", () => {
	test("name every control", () => {
		expect(FLOW_CONTROL_LABELS).toEqual({
			fit: "Fit to view",
			lock: "Lock canvas",
			zoomIn: "Zoom in",
			zoomOut: "Zoom out",
		});
	});
});

describe("sides", () => {
	test("every side places a handle", () => {
		for (const side of FLOW_SIDES) expect(resolveHandleStyle(side, 0.5)).toBeDefined();
	});
});

describe("resolveFlowChildLayer", () => {
	test("edges and the background draw in the Skia canvas", () => {
		expect(resolveFlowChildLayer("DelacourUI.Flow.Edge")).toBe("canvas");
		expect(resolveFlowChildLayer("DelacourUI.Flow.Background")).toBe("canvas");
	});

	test("controls and the minimap float on top", () => {
		expect(resolveFlowChildLayer("DelacourUI.Flow.Controls")).toBe("overlay");
		expect(resolveFlowChildLayer("DelacourUI.Flow.MiniMap")).toBe("overlay");
	});

	test("nodes, groups and anything unknown go in the node layer", () => {
		expect(resolveFlowChildLayer("DelacourUI.Flow.Node")).toBe("nodes");
		expect(resolveFlowChildLayer("DelacourUI.Flow.Group")).toBe("nodes");
		expect(resolveFlowChildLayer("MyEdgeWrapper")).toBe("nodes");
		expect(resolveFlowChildLayer(undefined)).toBe("nodes");
	});
});
