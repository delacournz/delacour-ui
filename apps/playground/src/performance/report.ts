import { PERFORMANCE_LABELS, PERFORMANCE_WORKLOAD_IDS, type PerformanceWorkload } from "./protocol";

export type ProfileMeasurement = {
	value: number | boolean | null;
	metricField: string;
	unavailableReason?: string;
};

export type PerformanceMetricKey =
	| "frameP95Ms"
	| "frameP50Ms"
	| "framesWithinInterval"
	| "jsStalls"
	| "peakMemoryMb"
	| "keyboardDelayP95Ms"
	| "keyboardDelayP50Ms"
	| "inputLossCount"
	| "retainedMemoryMb"
	| "finalClosed"
	| "staleOverlayCount";

export type PerformanceRun = {
	rawProfilePath: string;
	metrics: Partial<Record<PerformanceMetricKey, ProfileMeasurement>>;
	retainedMemorySamplesMb?: number[];
};

export type PerformanceWorkloadProfile = {
	warmupRuns: { rawProfilePath: string }[];
	measuredRuns: PerformanceRun[];
};

export type PerformanceProfile = {
	commit: string;
	protocolVersion: number;
	profileType: "release";
	device: { kind: "physical"; id: string; model: string; os: string; refreshIntervalMs: number };
	profiler: { name: string; version: string };
	workloads: Record<PerformanceWorkload, PerformanceWorkloadProfile>;
};

export type MetricComparison = {
	metricField: string;
	baselineMedian: number | null;
	candidateMedian: number | null;
	deltaPercent: number | null;
	regressionBudgetPercent: number | null;
	withinRegressionBudget: boolean | null;
	improvedByAtLeast10Percent: boolean | null;
	unavailableReasons: string[];
};

export type PerformanceWorkloadComparison = {
	frameP95?: MetricComparison;
	frameP50?: MetricComparison;
	framesWithinInterval?: {
		metricField: string;
		baselineMinimum: number | null;
		candidateMinimum: number | null;
		required: number;
		passed: boolean | null;
		unavailableReasons: string[];
	};
	jsStalls?: MetricComparison;
	peakMemory?: MetricComparison;
	keyboardDelayP95?: MetricComparison;
	keyboardDelayP50?: MetricComparison;
	inputLossCount?: {
		metricField: string;
		candidateMaximum: number | null;
		passed: boolean | null;
		unavailableReasons: string[];
	};
	retainedMemory?: MetricComparison & {
		growthTrendReview: boolean;
		growthTrendRuns: number[];
		growthSamplesProvided: boolean;
	};
	finalClosed?: { metricField: string; passed: boolean | null; unavailableReasons: string[] };
	staleOverlayCount?: {
		metricField: string;
		candidateMaximum: number | null;
		passed: boolean | null;
		unavailableReasons: string[];
	};
};

export type PerformanceComparison = {
	status: "meets-budgets" | "fails-budgets" | "incomplete";
	complete: boolean;
	baselineCommit: string;
	candidateCommit: string;
	device: PerformanceProfile["device"];
	profiler: PerformanceProfile["profiler"];
	protocolVersion: number;
	workloads: Record<PerformanceWorkload, PerformanceWorkloadComparison>;
	rawProfiles: Record<
		PerformanceWorkload,
		{
			baselineWarmups: string[];
			baselineRuns: string[];
			candidateWarmups: string[];
			candidateRuns: string[];
		}
	>;
	failures: string[];
};

type UnknownRecord = Record<string, unknown>;

export const PERFORMANCE_REQUIRED_METRICS: Record<PerformanceWorkload, readonly PerformanceMetricKey[]> = {
	"long-list": ["frameP95Ms", "framesWithinInterval", "jsStalls", "peakMemoryMb"],
	"chart-updates": ["frameP95Ms", "framesWithinInterval", "jsStalls", "peakMemoryMb"],
	"keyboard-sheet": ["keyboardDelayP95Ms", "inputLossCount"],
	"overlay-lifecycle": ["peakMemoryMb", "retainedMemoryMb", "finalClosed", "staleOverlayCount"],
};

export const PERFORMANCE_OPTIONAL_METRICS: Partial<Record<PerformanceWorkload, readonly PerformanceMetricKey[]>> = {
	"long-list": ["frameP50Ms"],
	"chart-updates": ["frameP50Ms"],
	"keyboard-sheet": ["keyboardDelayP50Ms"],
};

function object(value: unknown, at: string): UnknownRecord {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${at} must be an object.`);
	return value as UnknownRecord;
}

function assertKeys(row: UnknownRecord, allowed: readonly string[], at: string): void {
	const unexpected = Object.keys(row).filter((key) => !allowed.includes(key));
	if (unexpected.length > 0) throw new Error(`${at} has unsupported fields: ${unexpected.join(", ")}.`);
}

function text(value: unknown, at: string): string {
	if (typeof value !== "string" || value.trim() === "") throw new Error(`${at} must be a non-empty string.`);
	return value;
}

function number(
	value: unknown,
	at: string,
	options: { positive?: boolean; max?: number; integer?: boolean } = {}
): number {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${at} must be a finite number.`);
	if (value < 0 || (options.positive && value === 0))
		throw new Error(`${at} must be non-negative${options.positive ? " and greater than zero" : ""}.`);
	if (options.max !== undefined && value > options.max) throw new Error(`${at} must be at most ${options.max}.`);
	if (options.integer && !Number.isInteger(value)) throw new Error(`${at} must be a whole number.`);
	return value;
}

function localProfilePath(value: unknown, at: string): string {
	const path = text(value, at);
	if (path.startsWith("/") || path.startsWith("\\") || /^[a-z][a-z\d+.-]*:/i.test(path) || /^[a-z]:[\\/]/i.test(path)) {
		throw new Error(`${at} must be a local relative path.`);
	}
	return path;
}

function measurement(
	value: unknown,
	at: string,
	kind: "number" | "fraction" | "integer" | "boolean"
): ProfileMeasurement {
	const row = object(value, at);
	assertKeys(row, ["value", "metricField", "unavailableReason"], at);
	const metricField = text(row.metricField, `${at}.metricField`);
	if (row.value === null) {
		const unavailableReason = text(row.unavailableReason, `${at}.unavailableReason`);
		return { metricField, unavailableReason, value: null };
	}
	if (row.unavailableReason !== undefined && row.unavailableReason !== null) {
		throw new Error(`${at}.unavailableReason is only valid when value is null.`);
	}
	if (kind === "boolean") {
		if (typeof row.value !== "boolean") throw new Error(`${at}.value must be a boolean or null.`);
		return { metricField, value: row.value };
	}
	const numeric = number(row.value, `${at}.value`, {
		integer: kind === "integer",
		max: kind === "fraction" ? 1 : undefined,
	});
	return { metricField, value: numeric };
}

function run(value: unknown, workload: PerformanceWorkload, index: number): PerformanceRun {
	const at = `workloads.${workload}.measuredRuns[${index}]`;
	const row = object(value, at);
	assertKeys(row, ["rawProfilePath", "metrics", "retainedMemorySamplesMb"], at);
	const metrics = object(row.metrics, `${at}.metrics`);
	const expected = PERFORMANCE_REQUIRED_METRICS[workload];
	const optional = PERFORMANCE_OPTIONAL_METRICS[workload] ?? [];
	for (const key of expected) {
		if (!(key in metrics))
			throw new Error(
				`${at}.metrics.${key} is required. Use null and unavailableReason when the profiler cannot supply it.`
			);
	}
	for (const key of Object.keys(metrics)) {
		if (!expected.includes(key as PerformanceMetricKey) && !optional.includes(key as PerformanceMetricKey)) {
			throw new Error(`${at}.metrics.${key} is not part of the protocol.`);
		}
	}

	const parsedMetrics: Partial<Record<PerformanceMetricKey, ProfileMeasurement>> = {};
	for (const key of expected) {
		const kind =
			key === "framesWithinInterval"
				? "fraction"
				: key === "inputLossCount" || key === "staleOverlayCount" || key === "jsStalls"
					? "integer"
					: key === "finalClosed"
						? "boolean"
						: "number";
		parsedMetrics[key] = measurement(metrics[key], `${at}.metrics.${key}`, kind);
	}
	for (const key of optional) {
		if (key in metrics) parsedMetrics[key] = measurement(metrics[key], `${at}.metrics.${key}`, "number");
	}

	let retainedMemorySamplesMb: number[] | undefined;
	if ("retainedMemorySamplesMb" in row) {
		if (workload !== "overlay-lifecycle")
			throw new Error(`${at}.retainedMemorySamplesMb is only valid for overlay-lifecycle.`);
		if (!Array.isArray(row.retainedMemorySamplesMb) || row.retainedMemorySamplesMb.length < 2) {
			throw new Error(`${at}.retainedMemorySamplesMb must contain at least two samples.`);
		}
		retainedMemorySamplesMb = row.retainedMemorySamplesMb.map((sample, sampleIndex) =>
			number(sample, `${at}.retainedMemorySamplesMb[${sampleIndex}]`)
		);
	}

	return {
		rawProfilePath: localProfilePath(row.rawProfilePath, `${at}.rawProfilePath`),
		metrics: parsedMetrics,
		...(retainedMemorySamplesMb ? { retainedMemorySamplesMb } : {}),
	};
}

function ensureMetricFields(profile: PerformanceProfile, workload: PerformanceWorkload): void {
	const runs = profile.workloads[workload].measuredRuns;
	for (const key of PERFORMANCE_REQUIRED_METRICS[workload]) {
		const fields = new Set(runs.map((row) => row.metrics[key]?.metricField));
		if (fields.size !== 1)
			throw new Error(`${workload}.${key} must use one exact metric field across its measured runs.`);
	}
	for (const key of PERFORMANCE_OPTIONAL_METRICS[workload] ?? []) {
		const present = runs.map((row) => key in row.metrics);
		if (present.some(Boolean) && !present.every(Boolean))
			throw new Error(`${workload}.${key} must be present in all measured runs or none.`);
		if (present.every(Boolean) && new Set(runs.map((row) => row.metrics[key]?.metricField)).size !== 1) {
			throw new Error(`${workload}.${key} must use one exact metric field across its measured runs.`);
		}
	}
}

/** Parse and validate a profile file's JSON value. */
export function parsePerformanceProfile(value: unknown): PerformanceProfile {
	const row = object(value, "profile");
	assertKeys(row, ["commit", "protocolVersion", "profileType", "device", "profiler", "workloads"], "profile");
	const commit = text(row.commit, "commit");
	if (!/^[\da-f]{40}$/i.test(commit)) throw new Error("commit must be a 40-character hexadecimal SHA.");
	const protocolVersion = number(row.protocolVersion, "protocolVersion", { positive: true, integer: true });
	if (row.profileType !== "release") throw new Error('profileType must be "release".');

	const rawDevice = object(row.device, "device");
	assertKeys(rawDevice, ["kind", "id", "model", "os", "refreshIntervalMs"], "device");
	if (rawDevice.kind !== "physical") throw new Error('device.kind must be "physical".');
	const device = {
		kind: "physical" as const,
		id: text(rawDevice.id, "device.id"),
		model: text(rawDevice.model, "device.model"),
		os: text(rawDevice.os, "device.os"),
		refreshIntervalMs: number(rawDevice.refreshIntervalMs, "device.refreshIntervalMs", { positive: true }),
	};
	const rawProfiler = object(row.profiler, "profiler");
	assertKeys(rawProfiler, ["name", "version"], "profiler");
	const profiler = {
		name: text(rawProfiler.name, "profiler.name"),
		version: text(rawProfiler.version, "profiler.version"),
	};
	const rawWorkloads = object(row.workloads, "workloads");
	const unknownWorkloads = Object.keys(rawWorkloads).filter(
		(key) => !PERFORMANCE_WORKLOAD_IDS.includes(key as PerformanceWorkload)
	);
	if (unknownWorkloads.length > 0)
		throw new Error(`workloads has unsupported entries: ${unknownWorkloads.join(", ")}.`);

	const workloads = {} as Record<PerformanceWorkload, PerformanceWorkloadProfile>;
	for (const id of PERFORMANCE_WORKLOAD_IDS) {
		if (!(id in rawWorkloads)) throw new Error(`workloads.${id} is required.`);
		const section = object(rawWorkloads[id], `workloads.${id}`);
		assertKeys(section, ["warmupRuns", "measuredRuns"], `workloads.${id}`);
		if (!Array.isArray(section.warmupRuns) || section.warmupRuns.length < 1) {
			throw new Error(`workloads.${id}.warmupRuns must contain at least one warmup.`);
		}
		const warmupRuns = section.warmupRuns.map((warmup, index) => {
			const item = object(warmup, `workloads.${id}.warmupRuns[${index}]`);
			assertKeys(item, ["rawProfilePath"], `workloads.${id}.warmupRuns[${index}]`);
			return {
				rawProfilePath: localProfilePath(item.rawProfilePath, `workloads.${id}.warmupRuns[${index}].rawProfilePath`),
			};
		});
		if (!Array.isArray(section.measuredRuns) || section.measuredRuns.length !== 3) {
			throw new Error(`workloads.${id}.measuredRuns must contain exactly three measured runs.`);
		}
		workloads[id] = { measuredRuns: section.measuredRuns.map((item, index) => run(item, id, index)), warmupRuns };
	}
	const profile: PerformanceProfile = { commit, device, profileType: "release", profiler, protocolVersion, workloads };
	for (const id of PERFORMANCE_WORKLOAD_IDS) ensureMetricFields(profile, id);
	return profile;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function numericMetric(
	profile: PerformanceProfile,
	workload: PerformanceWorkload,
	key: PerformanceMetricKey
): {
	value: number | null;
	reasons: string[];
} {
	const rows = profile.workloads[workload].measuredRuns.map((row) => row.metrics[key]);
	const reasons = rows.flatMap((item, index) =>
		!item
			? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${key} was not reported.`]
			: item.value === null
				? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${item.unavailableReason}`]
				: []
	);
	return {
		value: reasons.length > 0 ? null : median(rows.map((item) => item?.value as number)),
		reasons,
	};
}

function numericComparison(
	base: PerformanceProfile,
	candidate: PerformanceProfile,
	workload: PerformanceWorkload,
	key: PerformanceMetricKey,
	regressionBudget: boolean
): MetricComparison {
	const baseline = numericMetric(base, workload, key);
	const proposed = numericMetric(candidate, workload, key);
	const unavailableReasons = [...baseline.reasons, ...proposed.reasons];
	const baseField = base.workloads[workload].measuredRuns[0].metrics[key]?.metricField;
	const candidateField = candidate.workloads[workload].measuredRuns[0].metrics[key]?.metricField;
	const metricField =
		baseField === candidateField
			? (baseField ?? "not reported")
			: `baseline ${baseField ?? "not reported"}; candidate ${candidateField ?? "not reported"}`;
	if (unavailableReasons.length > 0 || baseline.value === null || proposed.value === null) {
		return {
			metricField,
			baselineMedian: baseline.value,
			candidateMedian: proposed.value,
			deltaPercent: null,
			regressionBudgetPercent: regressionBudget ? 10 : null,
			withinRegressionBudget: regressionBudget ? null : null,
			improvedByAtLeast10Percent: null,
			unavailableReasons,
		};
	}
	const deltaPercent =
		baseline.value === 0
			? proposed.value === 0
				? 0
				: null
			: ((proposed.value - baseline.value) / baseline.value) * 100;
	const withinRegressionBudget = !regressionBudget || proposed.value <= baseline.value * 1.1;
	const improvedByAtLeast10Percent = baseline.value === 0 ? false : proposed.value <= baseline.value * 0.9;
	return {
		metricField,
		baselineMedian: baseline.value,
		candidateMedian: proposed.value,
		deltaPercent,
		regressionBudgetPercent: regressionBudget ? 10 : null,
		withinRegressionBudget: regressionBudget ? withinRegressionBudget : null,
		improvedByAtLeast10Percent,
		unavailableReasons,
	};
}

function numericSamples(
	profile: PerformanceProfile,
	workload: PerformanceWorkload,
	key: PerformanceMetricKey
): {
	values: number[];
	reasons: string[];
} {
	const rows = profile.workloads[workload].measuredRuns.map((row) => row.metrics[key]);
	return {
		values: rows.flatMap((item) => (item && typeof item.value === "number" ? [item.value] : [])),
		reasons: rows.flatMap((item, index) =>
			!item
				? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${key} was not reported.`]
				: item.value === null
					? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${item.unavailableReason}`]
					: []
		),
	};
}

function candidateMaximum(
	profile: PerformanceProfile,
	workload: PerformanceWorkload,
	key: PerformanceMetricKey
): {
	value: number | null;
	reasons: string[];
} {
	const sample = numericSamples(profile, workload, key);
	return { value: sample.reasons.length > 0 ? null : Math.max(...sample.values), reasons: sample.reasons };
}

function verifyPair(base: PerformanceProfile, candidate: PerformanceProfile): void {
	if (base.commit === candidate.commit) throw new Error("baseline and candidate commits must differ.");
	if (base.protocolVersion !== candidate.protocolVersion)
		throw new Error("protocol version must match between profiles.");
	if (
		base.device.id !== candidate.device.id ||
		base.device.model !== candidate.device.model ||
		base.device.os !== candidate.device.os ||
		base.device.refreshIntervalMs !== candidate.device.refreshIntervalMs
	) {
		throw new Error("device identity, model, OS, and refresh interval must match between profiles.");
	}
	if (base.profiler.name !== candidate.profiler.name || base.profiler.version !== candidate.profiler.version) {
		throw new Error("profiler name and version must match between profiles.");
	}
	for (const workload of PERFORMANCE_WORKLOAD_IDS) {
		for (const key of PERFORMANCE_REQUIRED_METRICS[workload]) {
			const baseMeasurement = base.workloads[workload].measuredRuns[0].metrics[key];
			const candidateMeasurement = candidate.workloads[workload].measuredRuns[0].metrics[key];
			if (!baseMeasurement || !candidateMeasurement)
				throw new Error(`${workload}.${key} is required in both profiles.`);
			const baseField = baseMeasurement.metricField;
			const candidateField = candidateMeasurement.metricField;
			if (baseField !== candidateField) throw new Error(`${workload}.${key} metric field must match between profiles.`);
		}
		for (const key of PERFORMANCE_OPTIONAL_METRICS[workload] ?? []) {
			const baseField = base.workloads[workload].measuredRuns[0].metrics[key]?.metricField;
			const candidateField = candidate.workloads[workload].measuredRuns[0].metrics[key]?.metricField;
			if (baseField && candidateField && baseField !== candidateField) {
				throw new Error(`${workload}.${key} metric field must match between profiles.`);
			}
		}
	}
}

function fractionCheck(
	base: PerformanceProfile,
	candidate: PerformanceProfile,
	workload: PerformanceWorkload
): NonNullable<PerformanceWorkloadComparison["framesWithinInterval"]> {
	const baselineRows = base.workloads[workload].measuredRuns.map((row) => row.metrics.framesWithinInterval);
	const candidateRows = candidate.workloads[workload].measuredRuns.map((row) => row.metrics.framesWithinInterval);
	const reasons = (profile: PerformanceProfile, rows: (ProfileMeasurement | undefined)[]) =>
		rows.flatMap((item, index) =>
			!item
				? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: framesWithinInterval was not reported.`]
				: item.value === null
					? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${item.unavailableReason}`]
					: []
		);
	const unavailableReasons = [...reasons(base, baselineRows), ...reasons(candidate, candidateRows)];
	const metricField = baselineRows[0]?.metricField ?? "not reported";
	return {
		metricField,
		baselineMinimum:
			unavailableReasons.length > 0 ? null : Math.min(...baselineRows.map((item) => item?.value as number)),
		candidateMinimum:
			unavailableReasons.length > 0 ? null : Math.min(...candidateRows.map((item) => item?.value as number)),
		required: 0.95,
		passed:
			unavailableReasons.length > 0
				? null
				: baselineRows.every((item) => (item?.value as number) >= 0.95) &&
					candidateRows.every((item) => (item?.value as number) >= 0.95),
		unavailableReasons,
	};
}

function countCheck(
	base: PerformanceProfile,
	candidate: PerformanceProfile,
	workload: PerformanceWorkload,
	key: PerformanceMetricKey
): NonNullable<PerformanceWorkloadComparison["inputLossCount"]> {
	const baseSample = candidateMaximum(base, workload, key);
	const candidateSample = candidateMaximum(candidate, workload, key);
	const unavailableReasons = [...baseSample.reasons, ...candidateSample.reasons];
	const metricField = base.workloads[workload].measuredRuns[0].metrics[key]?.metricField ?? "not reported";
	return {
		metricField,
		candidateMaximum: candidateSample.value,
		passed: unavailableReasons.length > 0 ? null : candidateSample.value === 0,
		unavailableReasons,
	};
}

function booleanCheck(
	base: PerformanceProfile,
	candidate: PerformanceProfile,
	workload: PerformanceWorkload,
	key: PerformanceMetricKey
): NonNullable<PerformanceWorkloadComparison["finalClosed"]> {
	const baseRows = base.workloads[workload].measuredRuns.map((row) => row.metrics[key]);
	const candidateRows = candidate.workloads[workload].measuredRuns.map((row) => row.metrics[key]);
	const reasons = (profile: PerformanceProfile, rows: (ProfileMeasurement | undefined)[]) =>
		rows.flatMap((item, index) =>
			!item
				? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${key} was not reported.`]
				: item.value === null
					? [`${profile.commit.slice(0, 7)} ${workload} run ${index + 1}: ${item.unavailableReason}`]
					: []
		);
	const unavailableReasons = [...reasons(base, baseRows), ...reasons(candidate, candidateRows)];
	return {
		metricField: baseRows[0]?.metricField ?? "not reported",
		passed: unavailableReasons.length > 0 ? null : candidateRows.every((item) => item?.value === true),
		unavailableReasons,
	};
}

function growthTrendRuns(profile: PerformanceProfile, workload: PerformanceWorkload): number[] {
	return profile.workloads[workload].measuredRuns.flatMap((row, index) => {
		const samples = row.retainedMemorySamplesMb;
		return samples && samples.at(-1)! > samples[0] ? [index + 1] : [];
	});
}

/** Compare two profiles that use the same device, protocol, profiler, and metric fields. */
export function comparePerformanceProfiles(
	base: PerformanceProfile,
	candidate: PerformanceProfile
): PerformanceComparison {
	verifyPair(base, candidate);
	const workloads = {} as Record<PerformanceWorkload, PerformanceWorkloadComparison>;
	const rawProfiles = {} as PerformanceComparison["rawProfiles"];
	const failures: string[] = [];
	let complete = true;
	const addMetricReasons = (comparison: MetricComparison) => {
		if (comparison.unavailableReasons.length > 0) complete = false;
	};

	for (const id of PERFORMANCE_WORKLOAD_IDS) {
		const report: PerformanceWorkloadComparison = {};
		if (id === "long-list" || id === "chart-updates") {
			report.frameP95 = numericComparison(base, candidate, id, "frameP95Ms", true);
			if (
				base.workloads[id].measuredRuns.some((run) => run.metrics.frameP50Ms !== undefined) ||
				candidate.workloads[id].measuredRuns.some((run) => run.metrics.frameP50Ms !== undefined)
			) {
				report.frameP50 = numericComparison(base, candidate, id, "frameP50Ms", false);
				addMetricReasons(report.frameP50);
			}
			report.framesWithinInterval = fractionCheck(base, candidate, id);
			report.jsStalls = numericComparison(base, candidate, id, "jsStalls", false);
			report.peakMemory = numericComparison(base, candidate, id, "peakMemoryMb", false);
			addMetricReasons(report.frameP95);
			addMetricReasons(report.jsStalls);
			addMetricReasons(report.peakMemory);
			if (report.framesWithinInterval.passed === null) complete = false;
			else if (!report.framesWithinInterval.passed)
				failures.push(`${PERFORMANCE_LABELS[id]} did not keep 95% of frames within the device interval.`);
			if (report.frameP95.withinRegressionBudget === false)
				failures.push(`${PERFORMANCE_LABELS[id]} frame p95 regressed by more than 10%.`);
		} else if (id === "keyboard-sheet") {
			report.keyboardDelayP95 = numericComparison(base, candidate, id, "keyboardDelayP95Ms", true);
			if (
				base.workloads[id].measuredRuns.some((run) => run.metrics.keyboardDelayP50Ms !== undefined) ||
				candidate.workloads[id].measuredRuns.some((run) => run.metrics.keyboardDelayP50Ms !== undefined)
			) {
				report.keyboardDelayP50 = numericComparison(base, candidate, id, "keyboardDelayP50Ms", false);
				addMetricReasons(report.keyboardDelayP50);
			}
			report.inputLossCount = countCheck(base, candidate, id, "inputLossCount");
			addMetricReasons(report.keyboardDelayP95);
			if (report.inputLossCount.passed === null) complete = false;
			else if (!report.inputLossCount.passed) failures.push("Keyboard and sheet workload lost input.");
			if (report.keyboardDelayP95.withinRegressionBudget === false)
				failures.push("Keyboard delay p95 regressed by more than 10%.");
		} else {
			report.peakMemory = numericComparison(base, candidate, id, "peakMemoryMb", false);
			report.retainedMemory = numericComparison(base, candidate, id, "retainedMemoryMb", true) as NonNullable<
				PerformanceWorkloadComparison["retainedMemory"]
			>;
			report.retainedMemory.growthTrendRuns = growthTrendRuns(candidate, id);
			report.retainedMemory.growthTrendReview = report.retainedMemory.growthTrendRuns.length > 0;
			report.retainedMemory.growthSamplesProvided = candidate.workloads[id].measuredRuns.some(
				(run) => run.retainedMemorySamplesMb !== undefined
			);
			report.finalClosed = booleanCheck(base, candidate, id, "finalClosed");
			report.staleOverlayCount = countCheck(base, candidate, id, "staleOverlayCount");
			addMetricReasons(report.peakMemory);
			addMetricReasons(report.retainedMemory);
			if (report.finalClosed.passed === null) complete = false;
			else if (!report.finalClosed.passed) failures.push("Overlay workload did not end closed in every run.");
			if (report.staleOverlayCount.passed === null) complete = false;
			else if (!report.staleOverlayCount.passed) failures.push("Overlay workload left stale overlay nodes.");
			if (report.retainedMemory.withinRegressionBudget === false)
				failures.push("Retained memory regressed by more than 10%.");
		}
		workloads[id] = report;
		rawProfiles[id] = {
			baselineWarmups: base.workloads[id].warmupRuns.map((run) => run.rawProfilePath),
			baselineRuns: base.workloads[id].measuredRuns.map((run) => run.rawProfilePath),
			candidateWarmups: candidate.workloads[id].warmupRuns.map((run) => run.rawProfilePath),
			candidateRuns: candidate.workloads[id].measuredRuns.map((run) => run.rawProfilePath),
		};
	}
	return {
		status: !complete ? "incomplete" : failures.length > 0 ? "fails-budgets" : "meets-budgets",
		complete,
		baselineCommit: base.commit,
		candidateCommit: candidate.commit,
		device: candidate.device,
		profiler: candidate.profiler,
		protocolVersion: candidate.protocolVersion,
		workloads,
		rawProfiles,
		failures,
	};
}

function percent(value: number | null): string {
	return value === null ? "not available" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function metricLine(label: string, metric: MetricComparison): string {
	const measured = `field \`${metric.metricField}\`; baseline ${metric.baselineMedian ?? "not available"}; candidate ${metric.candidateMedian ?? "not available"}; change ${percent(metric.deltaPercent)}`;
	const budget =
		metric.regressionBudgetPercent === null
			? "no regression budget set"
			: metric.withinRegressionBudget === null
				? "budget incomplete"
				: metric.withinRegressionBudget
					? `within ${metric.regressionBudgetPercent}% budget`
					: `over ${metric.regressionBudgetPercent}% budget`;
	const improvement =
		metric.improvedByAtLeast10Percent === null
			? "improvement unavailable"
			: metric.improvedByAtLeast10Percent
				? "at least 10% lower"
				: "less than 10% lower";
	const reasons = metric.unavailableReasons.length > 0 ? `; missing: ${metric.unavailableReasons.join("; ")}` : "";
	return `- ${label}: ${measured}; ${budget}; ${improvement}${reasons}`;
}

function checkLine(label: string, passed: boolean | null, details: string, reasons: string[]): string {
	const status = passed === null ? "incomplete" : passed ? "meets target" : "fails target";
	const missing = reasons.length > 0 ? `; missing: ${reasons.join("; ")}` : "";
	return `- ${label}: ${details}; ${status}${missing}`;
}

/** Render a plain Markdown comparison. It reports measurements, not causal claims. */
export function formatPerformanceComparison(report: PerformanceComparison): string {
	const lines = [
		"# Native performance profile comparison",
		"",
		`Status: **${report.status}**`,
		`Baseline commit: \`${report.baselineCommit}\``,
		`Candidate commit: \`${report.candidateCommit}\``,
		`Physical device: ${report.device.model} (${report.device.id}), ${report.device.os}, ${1000 / report.device.refreshIntervalMs} Hz`,
		`Profiler: ${report.profiler.name} ${report.profiler.version}`,
		`Protocol version: ${report.protocolVersion}`,
		"",
		"This report compares measured profiles. It does not attribute a change to a code optimization.",
	];
	for (const id of PERFORMANCE_WORKLOAD_IDS) {
		const row = report.workloads[id];
		lines.push("", `## ${PERFORMANCE_LABELS[id]}`);
		if (row.frameP95) lines.push(metricLine("Frame p95", row.frameP95));
		if (row.frameP50) lines.push(metricLine("Frame p50", row.frameP50));
		if (row.framesWithinInterval) {
			lines.push(
				checkLine(
					"Frames within interval",
					row.framesWithinInterval.passed,
					`field \`${row.framesWithinInterval.metricField}\`; baseline minimum ${row.framesWithinInterval.baselineMinimum ?? "not available"}; candidate minimum ${row.framesWithinInterval.candidateMinimum ?? "not available"}; required ${row.framesWithinInterval.required}`,
					row.framesWithinInterval.unavailableReasons
				)
			);
		}
		if (row.jsStalls) lines.push(metricLine("JavaScript stalls", row.jsStalls));
		if (row.peakMemory) lines.push(metricLine("Peak memory MB", row.peakMemory));
		if (row.keyboardDelayP95) lines.push(metricLine("Keyboard delay p95 ms", row.keyboardDelayP95));
		if (row.keyboardDelayP50) lines.push(metricLine("Keyboard delay p50 ms", row.keyboardDelayP50));
		if (row.inputLossCount) {
			lines.push(
				checkLine(
					"Input loss count",
					row.inputLossCount.passed,
					`field \`${row.inputLossCount.metricField}\`; candidate maximum ${row.inputLossCount.candidateMaximum ?? "not available"}; required 0`,
					row.inputLossCount.unavailableReasons
				)
			);
		}
		if (row.retainedMemory) {
			lines.push(metricLine("Final retained memory MB", row.retainedMemory));
			const trend = row.retainedMemory.growthTrendReview
				? `review runs ${row.retainedMemory.growthTrendRuns.join(", ")}; this is a review flag, not a leak finding`
				: row.retainedMemory.growthSamplesProvided
					? "no increasing end-to-end sample trend"
					: "samples not supplied";
			lines.push(`- Retained-memory trend: ${trend}`);
		}
		if (row.finalClosed)
			lines.push(
				checkLine(
					"Final overlay state",
					row.finalClosed.passed,
					`field \`${row.finalClosed.metricField}\`; all candidate runs must end closed`,
					row.finalClosed.unavailableReasons
				)
			);
		if (row.staleOverlayCount) {
			lines.push(
				checkLine(
					"Stale overlay count",
					row.staleOverlayCount.passed,
					`field \`${row.staleOverlayCount.metricField}\`; candidate maximum ${row.staleOverlayCount.candidateMaximum ?? "not available"}; required 0`,
					row.staleOverlayCount.unavailableReasons
				)
			);
		}
		const paths = report.rawProfiles[id];
		lines.push(
			`- Raw profile paths (relative to each JSON): baseline warm-up ${paths.baselineWarmups.join(", ")}; baseline measured ${paths.baselineRuns.join(", ")}; candidate warm-up ${paths.candidateWarmups.join(", ")}; candidate measured ${paths.candidateRuns.join(", ")}`
		);
	}
	if (report.failures.length > 0)
		lines.push("", "## Budget failures", ...report.failures.map((failure) => `- ${failure}`));
	return `${lines.join("\n")}\n`;
}
