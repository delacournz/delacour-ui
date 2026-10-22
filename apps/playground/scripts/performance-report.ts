#!/usr/bin/env bun
import { constants } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
	comparePerformanceProfiles,
	formatPerformanceComparison,
	parsePerformanceProfile,
	type PerformanceProfile,
	type PerformanceWorkloadProfile,
} from "../src/performance/report";

function profilePaths(profile: PerformanceProfile): string[] {
	return Object.values(profile.workloads).flatMap((workload: PerformanceWorkloadProfile) => [
		...workload.warmupRuns.map((run) => run.rawProfilePath),
		...workload.measuredRuns.map((run) => run.rawProfilePath),
	]);
}

async function readProfile(filePath: string): Promise<PerformanceProfile> {
	const absolutePath = resolve(filePath);
	const text = await readFile(absolutePath, "utf8");
	let value: unknown;
	try {
		value = JSON.parse(text) as unknown;
	} catch (error) {
		throw new Error(`${filePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
	}
	const profile = parsePerformanceProfile(value);
	for (const relativePath of profilePaths(profile)) {
		const rawPath = resolve(dirname(absolutePath), relativePath);
		try {
			const file = await stat(rawPath);
			if (!file.isFile()) throw new Error("not a regular file");
			await access(rawPath, constants.R_OK);
		} catch (error) {
			throw new Error(
				`${filePath} references an unreadable raw profile ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
	return profile;
}

async function main(args: readonly string[]): Promise<void> {
	if (args.length !== 2) {
		throw new Error("Usage: bun scripts/performance-report.ts <baseline.json> <candidate.json>");
	}
	const [baselinePath, candidatePath] = args;
	const [baseline, candidate] = await Promise.all([readProfile(baselinePath), readProfile(candidatePath)]);
	const report = comparePerformanceProfiles(baseline, candidate);
	process.stdout.write(formatPerformanceComparison(report));
	if (report.status !== "meets-budgets") process.exitCode = 1;
}

if (import.meta.main) {
	void main(process.argv.slice(2)).catch((error: unknown) => {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exitCode = 1;
	});
}
