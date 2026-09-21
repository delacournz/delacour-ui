import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { findSkill, SKILLS, type Skill } from "@delacour/skills";
import { createOutput, type Output, style } from "../ui/output";

/**
 * Installs the agent skill into whichever assistants this project uses.
 *
 * An agent asked for "a settings screen" without it writes plausible React
 * Native from memory — the right shape, and none of the parts that matter here.
 * The MCP server solves the same problem for hosts that speak MCP; a skill is
 * the copy that works everywhere else, and it is what an agent reads *before*
 * it decides whether to reach for a tool at all.
 *
 * Nothing is fetched. The files are bundled into this binary, so a run works
 * offline and always ships the skill that matches the CLI a project is pinned
 * to — which is the whole point of versioning them together.
 */

/**
 * Where each assistant reads skills from.
 *
 * `marker` is what says an assistant is in use here: its own directory. Guessing
 * wrong in the other direction is the costly one — a skill written into
 * `.cursor/` in a repository that has never seen Cursor is a file in someone's
 * diff that they did not ask for.
 */
const AGENTS = [
	{ id: "claude", label: "Claude Code", marker: ".claude", directory: ".claude/skills" },
	{ id: "cursor", label: "Cursor", marker: ".cursor", directory: ".cursor/skills" },
	{ id: "opencode", label: "OpenCode", marker: ".opencode", directory: ".opencode/skills" },
	{ id: "codex", label: "Codex", marker: ".agents", directory: ".agents/skills" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
export const AGENT_IDS: readonly string[] = [...AGENTS.map((agent) => agent.id), "all"];

export type SkillsOptions = {
	cwd: string;
	/** `claude`, `cursor`, `opencode`, `codex`, or `all`. Unset detects. */
	agent?: string[];
	/** `project` writes into the repository; `user` into the home directory. */
	scope?: string;
	list?: boolean;
	force?: boolean;
	silent?: boolean;
	yes?: boolean;
};

type Target = { label: string; root: string };

/**
 * `path` is what gets written and `display` is what gets printed, and they are
 * two fields rather than one because they must be: a relative path is resolved
 * against `process.cwd()`, not against `--cwd`, so writing the displayed form
 * put every file in the wrong directory the moment the two differed.
 */
type Planned = { path: string; display: string; content: string; exists: boolean };

export async function skills(names: string[], options: SkillsOptions): Promise<void> {
	const output = createOutput(options);
	const scope = parseScope(options.scope);
	const chosen = chooseSkills(names);
	const targets = resolveTargets(options.agent, scope, options.cwd);

	if (options.list) {
		listSkills(targets, output);
		return;
	}

	output.intro("delacour skills");

	// Planned in full before anything is written, so a run that would clobber an
	// edited skill says so before it has half-written another one.
	const planned = chosen.flatMap((skill) => targets.flatMap((target) => plan(skill, target, options.cwd, scope)));
	const clashes = planned.filter((file) => file.exists);

	if (clashes.length > 0 && !options.force) {
		output.warn(
			[
				`${clashes.length} file${clashes.length === 1 ? "" : "s"} already there:`,
				...clashes.map((file) => `  ${style.path(file.display)}`),
				"",
				`Pass ${style.code("--force")} to replace them.`,
			].join("\n")
		);
		return;
	}

	for (const file of planned) {
		await mkdir(dirname(file.path), { recursive: true });
		await writeFile(file.path, file.content, "utf-8");
	}

	output.success(`Wrote ${planned.length} file${planned.length === 1 ? "" : "s"}.`);
	if (!output.silent) output.log(planned.map((file) => `  ${style.path(file.display)}`).join("\n"));

	output.info(
		[
			`Installed for ${targets.map((target) => target.label).join(", ")}.`,
			"Start a new session so the assistant picks it up. Then ask for a screen — it will",
			`run ${style.code("delacour list")} and copy real components rather than writing them.`,
		].join("\n")
	);

	output.outro(
		scope === "user"
			? "Available in every project on this machine."
			: `Available in this project. ${style.code("--scope user")} installs it everywhere.`
	);
}

function parseScope(scope: string | undefined): "project" | "user" {
	if (scope === undefined || scope === "project") return "project";
	if (scope === "user") return "user";

	throw new Error(`Unknown scope "${scope}". Use --scope project or --scope user.`);
}

function chooseSkills(names: string[]): Skill[] {
	if (names.length === 0) return [...SKILLS];

	return names.map((name) => {
		const skill = findSkill(name);
		if (!skill) {
			throw new Error(`Unknown skill "${name}". Available: ${SKILLS.map((one) => one.name).join(", ")}.`);
		}

		return skill;
	});
}

/**
 * Which assistants to write for.
 *
 * Detection is directory presence, and a project with none named gets Claude
 * Code — writing nothing at all and exiting zero is the outcome nobody can
 * debug, so the fallback says out loud what it did.
 */
function resolveTargets(requested: string[] | undefined, scope: "project" | "user", cwd: string): Target[] {
	const base = scope === "user" ? homedir() : cwd;
	const toTarget = (agent: (typeof AGENTS)[number]): Target => ({
		label: agent.label,
		root: join(base, agent.directory),
	});

	if (requested && requested.length > 0) {
		if (requested.includes("all")) return AGENTS.map(toTarget);

		return requested.map((id) => {
			const agent = AGENTS.find((candidate) => candidate.id === id);
			if (!agent) throw new Error(`Unknown agent "${id}". Use one of: ${AGENT_IDS.join(", ")}.`);

			return toTarget(agent);
		});
	}

	const detected = AGENTS.filter((agent) => existsSync(join(base, agent.marker)));
	return detected.length > 0 ? detected.map(toTarget) : [toTarget(AGENTS[0])];
}

function plan(skill: Skill, target: Target, cwd: string, scope: "project" | "user"): Planned[] {
	return skill.files.map((file) => {
		const absolute = join(target.root, skill.name, file.path);

		return {
			path: absolute,
			// A home-directory path stays absolute when printed: `../../../..` from
			// a project root tells a reader nothing about where the file went.
			display: scope === "user" ? absolute : relative(cwd, absolute) || absolute,
			content: file.content,
			exists: existsSync(absolute),
		};
	});
}

function listSkills(targets: readonly Target[], output: Output): void {
	const lines = SKILLS.flatMap((skill) => [
		`${style.code(skill.name)} — ${skill.description}`,
		...skill.files.map((file) => `  ${style.dim(file.path)}`),
	]);

	output.log(
		[
			...lines,
			"",
			`Would install for: ${targets.map((target) => target.label).join(", ")}`,
			...targets.map((target) => `  ${style.path(target.root)}`),
		].join("\n")
	);
}
