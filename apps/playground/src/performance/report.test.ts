import { describe, expect, test } from "bun:test";
import { PERFORMANCE_WORKLOAD_IDS, type PerformanceWorkload } from "./protocol";
import { comparePerformanceProfiles, formatPerformanceComparison, parsePerformanceProfile } from "./report";
type RawWorkload = {
	warmupRuns: { rawProfilePath: string }[];
	measuredRuns: {
		rawProfilePath: string;
		metrics: Record<string, { metricField: string; value: number | boolean | null; unavailableReason?: string }>;
		retainedMemorySamplesMb?: number[];
	}[];
};

type RawProfile = {
	commit: string;
	device: { kind: "physical"; id: string; model: string; os: string; refreshIntervalMs: number };
	profileType: "release";
	profiler: { name: string; version: string };
	protocolVersion: number;
	workloads: Record<PerformanceWorkload, RawWorkload>;
};

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

function measurement(value: number | boolean | null, metricField: string, unavailableReason?: string) {
	return unavailableReason === undefined ? { metricField, value } : { metricField, unavailableReason, value };
}

function workload(id: PerformanceWorkload, factor = 1): RawWorkload {
	const measured = Array.from({ length: 3 }, (_, index) => {
		const n = index + 1;
		const common = { rawProfilePath: `profiles/${id}-${n}.trace` };
		if (id === "long-list" || id === "chart-updates") {
			return {
				...common,
				metrics: {
					frameP95Ms: measurement(14 * factor, "frame.p95"),
					framesWithinInterval: measurement(0.97, "frame.withinIntervalFraction"),
					jsStalls: measurement(Math.round(2 * factor), "js.stalls"),
					peakMemoryMb: measurement(210 * factor, "process.peakMemoryMb"),
				},
			};
		}
		if (id === "keyboard-sheet") {
			return {
				...common,
				metrics: {
					keyboardDelayP95Ms: measurement(120 * factor, "keyboard.visibleDelay.p95"),
					inputLossCount: measurement(0, "input.lostCount"),
				},
			};
		}
		return {
			...common,
			metrics: {
				peakMemoryMb: measurement(220 * factor, "process.peakMemoryMb"),
				retainedMemoryMb: measurement(180 * factor, "process.retainedMemoryMb.afterIdle"),
				finalClosed: measurement(true, "overlay.finalState.closed"),
				staleOverlayCount: measurement(0, "overlay.staleNodeCount"),
			},
			retainedMemorySamplesMb: [179, 180, 180 + index].map((value) => value * factor),
		};
	});
	return {
		measuredRuns: measured,
		warmupRuns: [{ rawProfilePath: `profiles/${id}-warmup.trace` }],
	};
}

function profile(commit: string, factor = 1): RawProfile {
	return {
		commit,
		device: { kind: "physical", id: "device-a", model: "iPhone 17 Pro", os: "iOS 27.1", refreshIntervalMs: 16.67 },
		profileType: "release",
		profiler: { name: "Instruments", version: "27.1" },
		protocolVersion: 1,
		workloads: Object.fromEntries(PERFORMANCE_WORKLOAD_IDS.map((id) => [id, workload(id, factor)])) as Record<
			PerformanceWorkload,
			RawWorkload
		>,
	};
}

describe("performance report", () => {
	test("parses and compares a valid paired profile set", () => {
		const base = parsePerformanceProfile(profile(SHA_A));
		const candidate = parsePerformanceProfile(profile(SHA_B, 0.8));
		const result = comparePerformanceProfiles(base, candidate);

		expect(result.status).toBe("meets-budgets");
		expect(result.complete).toBe(true);
		expect(result.workloads["long-list"].frameP95?.improvedByAtLeast10Percent).toBe(true);
		expect(result.workloads["overlay-lifecycle"].retainedMemory?.growthTrendReview).toBe(true);
		expect(formatPerformanceComparison(result)).toContain("Long list");
	});

	test("reports p50 and keeps the local raw-profile paths", () => {
		const base = profile(SHA_A);
		const candidate = profile(SHA_B, 0.8);
		for (const source of [base, candidate]) {
			for (const id of ["long-list", "chart-updates"] as const) {
				for (const run of source.workloads[id].measuredRuns) {
					run.metrics.frameP50Ms = measurement(9, "frame.p50");
				}
			}
			for (const run of source.workloads["keyboard-sheet"].measuredRuns) {
				run.metrics.keyboardDelayP50Ms = measurement(80, "keyboard.visibleDelay.p50");
			}
		}
		const result = comparePerformanceProfiles(parsePerformanceProfile(base), parsePerformanceProfile(candidate));
		const markdown = formatPerformanceComparison(result);
		expect(result.workloads["long-list"].frameP50?.baselineMedian).toBe(9);
		expect(markdown).toContain("Frame p50");
		expect(markdown).toContain("profiles/long-list-warmup.trace");
	});

	test("fails a regression beyond the ten percent budget", () => {
		const result = comparePerformanceProfiles(
			parsePerformanceProfile(profile(SHA_A)),
			parsePerformanceProfile(profile(SHA_B, 1.2))
		);
		expect(result.status).toBe("fails-budgets");
		expect(result.workloads["long-list"].frameP95?.withinRegressionBudget).toBe(false);
	});

	test("keeps unavailable metrics incomplete and prints the reason", () => {
		const candidate = profile(SHA_B);
		const run = candidate.workloads["long-list"].measuredRuns[0];
		run.metrics.frameP95Ms = measurement(null, "frame.p95", "The profiler export has no frame percentile.");
		const result = comparePerformanceProfiles(
			parsePerformanceProfile(profile(SHA_A)),
			parsePerformanceProfile(candidate)
		);
		expect(result.status).toBe("incomplete");
		expect(result.complete).toBe(false);
		expect(formatPerformanceComparison(result)).toContain("The profiler export has no frame percentile.");
	});

	test("rejects mismatched device, protocol, profiler, and metric identities", () => {
		const base = profile(SHA_A);
		const candidate = profile(SHA_B);
		candidate.device.id = "device-b";
		expect(() => comparePerformanceProfiles(parsePerformanceProfile(base), parsePerformanceProfile(candidate))).toThrow(
			/device/
		);

		candidate.device.id = base.device.id;
		candidate.profiler.version = "other";
		expect(() => comparePerformanceProfiles(parsePerformanceProfile(base), parsePerformanceProfile(candidate))).toThrow(
			/profiler/
		);

		candidate.profiler.version = base.profiler.version;
		candidate.protocolVersion = 2;
		expect(() => comparePerformanceProfiles(parsePerformanceProfile(base), parsePerformanceProfile(candidate))).toThrow(
			/protocol/
		);

		candidate.protocolVersion = base.protocolVersion;
		candidate.workloads["chart-updates"].measuredRuns[0].metrics.frameP95Ms.metricField = "other.field";
		expect(() => comparePerformanceProfiles(parsePerformanceProfile(base), parsePerformanceProfile(candidate))).toThrow(
			/metric field/
		);
	});

	test("rejects malformed, non-finite, and negative measurements", () => {
		const bad = profile(SHA_A);
		bad.workloads["long-list"].measuredRuns[0].metrics.frameP95Ms.value = Number.NaN;
		expect(() => parsePerformanceProfile(bad)).toThrow(/finite/);

		bad.workloads["long-list"].measuredRuns[0].metrics.frameP95Ms.value = -1;
		expect(() => parsePerformanceProfile(bad)).toThrow(/non-negative/);

		bad.workloads["long-list"].measuredRuns[0].metrics.frameP95Ms = measurement(null, "frame.p95");
		expect(() => parsePerformanceProfile(bad)).toThrow(/unavailableReason/);

		bad.commit = "short-sha";
		expect(() => parsePerformanceProfile(bad)).toThrow(/40-character/);

		const simulator = profile(SHA_A);
		(simulator.device as { kind: string }).kind = "simulator";
		expect(() => parsePerformanceProfile(simulator)).toThrow(/physical/);
	});

	test("requires all workloads, one warmup, and exactly three measured runs", () => {
		const bad = profile(SHA_A);
		Reflect.deleteProperty(bad.workloads, "chart-updates");
		expect(() => parsePerformanceProfile(bad)).toThrow(/chart-updates/);

		const noWarmup = profile(SHA_A);
		noWarmup.workloads["long-list"].warmupRuns = [];
		expect(() => parsePerformanceProfile(noWarmup)).toThrow(/warmup/);

		const short = profile(SHA_A);
		short.workloads["long-list"].measuredRuns.pop();
		expect(() => parsePerformanceProfile(short)).toThrow(/exactly three/);
	});

	test("requires accessible raw profile paths and distinguishes overlay failures", () => {
		const bad = profile(SHA_A);
		bad.workloads["keyboard-sheet"].measuredRuns[0].rawProfilePath = "https://example.test/profile";
		expect(() => parsePerformanceProfile(bad)).toThrow(/local relative/);

		const invalid = profile(SHA_B);
		invalid.workloads["overlay-lifecycle"].measuredRuns[1].metrics.staleOverlayCount.value = 1;
		const result = comparePerformanceProfiles(
			parsePerformanceProfile(profile(SHA_A)),
			parsePerformanceProfile(invalid)
		);
		expect(result.status).toBe("fails-budgets");
		expect(result.workloads["overlay-lifecycle"].staleOverlayCount?.passed).toBe(false);
	});
});
