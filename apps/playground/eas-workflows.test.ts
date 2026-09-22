import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REQUIRED_ENV, type TagKind } from "./scripts/eas-tag";

/**
 * The EAS workflows, held to what EAS will not check for them.
 *
 * `eas workflow:validate` passes a job that cannot possibly run: the first
 * `check_update_channel` validated, shipped, and died on the builder with
 * `Module not found "scripts/eas-check-channel.ts"` because a custom job starts
 * from an empty VM. Every assertion here is a failure that otherwise surfaces
 * only on a real release, minutes in.
 */

type Step = { readonly uses?: string; readonly run?: string };
type Job = {
	readonly type?: string;
	readonly needs?: readonly string[];
	readonly env?: Readonly<Record<string, string>>;
	readonly params?: Readonly<Record<string, unknown>>;
	readonly steps?: readonly Step[];
};
type Workflow = { readonly jobs: Readonly<Record<string, Job>> };

const PLAYGROUND = import.meta.dirname;
const WORKFLOWS = join(PLAYGROUND, ".eas", "workflows");

const workflows = readdirSync(WORKFLOWS)
	.filter((file) => file.endsWith(".yml"))
	.map((file) => ({ file, workflow: Bun.YAML.parse(readFileSync(join(WORKFLOWS, file), "utf8")) as Workflow }));

const jobs = workflows.flatMap(({ file, workflow }) =>
	Object.entries(workflow.jobs).map(([id, job]) => ({ file, id, job, all: workflow.jobs }))
);

/** The `needs.<job>` ids a job's params, env, condition or steps read. */
function neededIn(job: Job): string[] {
	return [...JSON.stringify(job).matchAll(/needs\.([a-z_]+)\./g)].map((match) => match[1] as string);
}

function scriptsRunBy(job: Job): string[] {
	return (job.steps ?? []).flatMap((step) => [...(step.run ?? "").matchAll(/scripts\/[\w.-]+\.ts/g)].map((m) => m[0]));
}

/** The kind a job passes to `scripts/eas-tag.ts`, when it runs that script at all. */
function tagKindOf(job: Job): TagKind | undefined {
	const match = (job.steps ?? [])
		.map((step) => /scripts\/eas-tag\.ts (build|update)\b/.exec(step.run ?? ""))
		.find(Boolean);
	return match?.[1] as TagKind | undefined;
}

describe("every workflow job", () => {
	/**
	 * An output read from a job not in `needs` is not an error to EAS — it
	 * renders as the literal string "undefined" and the job carries on with it.
	 */
	test.each(jobs.map(({ file, id, job }) => [`${file} → ${id}`, job] as const))(
		"%s needs every job whose outputs it reads",
		(_, job) => {
			for (const needed of neededIn(job)) expect(job.needs ?? []).toContain(needed);
		}
	);

	test.each(jobs.map(({ file, id, job }) => [`${file} → ${id}`, job] as const))(
		"%s runs only scripts that exist",
		(_, job) => {
			for (const script of scriptsRunBy(job)) expect(existsSync(join(PLAYGROUND, script))).toBe(true);
		}
	);
});

describe("a custom job", () => {
	const custom = jobs.filter(({ job }) => job.type === undefined && scriptsRunBy(job).length > 0);

	test.each(custom.map(({ file, id, job }) => [`${file} → ${id}`, job] as const))(
		"%s checks the repo out before running a script from it",
		(_, job) => {
			const steps = job.steps ?? [];
			const checkout = steps.findIndex((step) => step.uses === "eas/checkout");
			const firstScript = steps.findIndex((step) => /scripts\//.test(step.run ?? ""));
			expect(checkout).toBeGreaterThanOrEqual(0);
			expect(checkout).toBeLessThan(firstScript);
		}
	);
});

describe("git tags", () => {
	const productionBuilds = jobs.filter(({ job }) => job.type === "build" && job.params?.profile === "production");
	const updates = jobs.filter(({ job }) => job.type === "update");

	/**
	 * The tag jobs sat commented out from the first scaffold until 2026-09-22,
	 * and nothing noticed. Every binary and every update a workflow ships gets a
	 * tag job, or this fails.
	 */
	test.each(productionBuilds.map(({ file, id, all }) => [`${file} → ${id}`, id, all] as const))(
		"%s is tagged",
		(_, id, all) => {
			const taggers = Object.values(all).filter((job) => tagKindOf(job) === "build" && job.needs?.includes(id));
			expect(taggers).toHaveLength(1);
		}
	);

	test.each(updates.map(({ file, id, all }) => [`${file} → ${id}`, id, all] as const))("%s is tagged", (_, id, all) => {
		const taggers = Object.values(all).filter((job) => tagKindOf(job) === "update" && job.needs?.includes(id));
		expect(taggers).toHaveLength(1);
	});

	const taggers = jobs.flatMap(({ file, id, job, all }) => {
		const kind = tagKindOf(job);
		return kind ? [{ name: `${file} → ${id}`, kind, job, all }] : [];
	});

	test.each(taggers.map(({ name, kind, job }) => [name, kind, job] as const))(
		"%s sets every variable eas-tag.ts reads for a %s",
		(_, kind, job) => {
			expect(Object.keys(job.env ?? {})).toEqual(expect.arrayContaining([...REQUIRED_ENV[kind]]));
		}
	);

	/** An iOS tag reading the Android build's outputs is a copy-paste away. */
	test.each(taggers.map(({ name, job, all }) => [name, job, all] as const))(
		"%s reads only the jobs for its own platform",
		(_, job, all) => {
			for (const needed of neededIn(job)) {
				const platform = all[needed]?.params?.platform;
				if (platform !== undefined) expect(job.env?.TAG_PLATFORM).toBe(String(platform));
			}
		}
	);

	test("exist in both workflows that build for production", () => {
		expect(taggers.map(({ name }) => name).sort()).toEqual([
			"build:native:prod.yml → tag_android_build",
			"build:native:prod.yml → tag_ios_build",
			"release:prod.yml → tag_android_build",
			"release:prod.yml → tag_android_update",
			"release:prod.yml → tag_ios_build",
			"release:prod.yml → tag_ios_update",
		]);
	});
});
