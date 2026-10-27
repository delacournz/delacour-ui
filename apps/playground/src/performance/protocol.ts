export const PERFORMANCE_WORKLOAD_IDS = ["long-list", "chart-updates", "keyboard-sheet", "overlay-lifecycle"] as const;

export type PerformanceWorkload = (typeof PERFORMANCE_WORKLOAD_IDS)[number];

export const PERFORMANCE_LABELS: Record<PerformanceWorkload, string> = {
	"long-list": "Long list",
	"chart-updates": "Chart updates",
	"keyboard-sheet": "Keyboard and sheet",
	"overlay-lifecycle": "Overlay lifecycle",
};

export const PERFORMANCE_PROTOCOL = {
	version: 1,
	durationMs: 30_000,
	chartIntervalMs: 100,
	keyboardCycles: 30,
	keyboardText: "Delacour performance",
	overlayCycles: 100,
	batchSize: 10,
	stepMs: 500,
	idleMs: 5000,
} as const;

export const LIST_ROWS = Array.from({ length: 10_000 }, (_, index) => ({
	id: `row-${index + 1}`,
	index: index + 1,
	label: `Record ${String(index + 1).padStart(5, "0")}`,
}));

export function chartRows(tick: number): { x: number; alpha: number; beta: number; gamma: number }[] {
	return Array.from({ length: 1000 }, (_, x) => ({
		x,
		alpha: 50 + 30 * Math.sin((x + tick) / 20),
		beta: 50 + 25 * Math.cos((x + tick * 2) / 30),
		gamma: 50 + 20 * Math.sin((x + tick * 3) / 40),
	}));
}

export const OVERLAY_STEPS = PERFORMANCE_PROTOCOL.overlayCycles * 4;

/** Open and close each overlay, then hold the closed state after every batch. */
export function overlayStep(index: number): {
	kind: "dialog" | "sheet";
	isOpen: boolean;
	cycle: number;
	waitMs: number;
} {
	if (!Number.isInteger(index) || index < 0 || index >= OVERLAY_STEPS) {
		throw new Error("Overlay step is outside the protocol.");
	}
	const phase = index % 4;
	const cycle = Math.floor(index / 4) + 1;
	const isBatchEnd = phase === 3 && cycle % PERFORMANCE_PROTOCOL.batchSize === 0;
	return {
		kind: phase < 2 ? "dialog" : "sheet",
		isOpen: phase % 2 === 0,
		cycle,
		waitMs: isBatchEnd ? PERFORMANCE_PROTOCOL.idleMs : PERFORMANCE_PROTOCOL.stepMs,
	};
}
