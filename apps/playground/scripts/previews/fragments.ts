/**
 * The contract between the orchestrator (`scripts/capture-previews.ts`) and
 * the specs (`e2e/previews/*.e2e.ts`): both are Bun processes, but they run in
 * different places — the orchestrator here, the specs inside `warden e2e` on
 * one leased simulator each — so they talk through files under `.previews/`.
 *
 * The orchestrator writes `plan.json` before the run: every demo it wants
 * captured, with the hash and settings the spec cannot cheaply work out for
 * itself. Each spec writes one fragment per demo it captured, and the
 * orchestrator folds the fragments into the manifest afterwards. A spec that
 * crashes loses the fragments it had not written, and nothing else.
 */

import { join } from "node:path";
import type { DemoFrame } from "./config";
import { PLAYGROUND } from "./config";
import type { PreviewEntryJson } from "./manifest";

export const PREVIEWS_STATE_DIR = join(PLAYGROUND, ".previews");
export const PLAN_PATH = join(PREVIEWS_STATE_DIR, "plan.json");
export const FRAGMENTS_DIR = join(PREVIEWS_STATE_DIR, "fragments");

/** What a spec needs to know about one demo it is about to capture. */
export type PlannedCapture = {
	id: string;
	component: string;
	demo: string;
	title: string;
	caption?: string;
	frame: DemoFrame;
	animated: boolean;
	leadMs: number;
	settleMs: number;
	tailMs: number;
	sourceHash: string;
};

export type PlanFile = {
	/** When the orchestrator planned, so a stale plan from an old run is recognisable. */
	plannedAt: string;
	demos: Record<string, PlannedCapture>;
};

/** One captured demo, as the spec reports it. The orchestrator fills in nothing. */
export type Fragment = PreviewEntryJson;

export function fragmentPath(id: string): string {
	return join(FRAGMENTS_DIR, `${id}.json`);
}

export async function readPlan(): Promise<PlanFile | undefined> {
	const file = Bun.file(PLAN_PATH);
	if (!(await file.exists())) return undefined;
	return (await file.json()) as PlanFile;
}
