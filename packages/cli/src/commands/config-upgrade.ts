import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import * as clack from "@clack/prompts";
import { findConfig, MissingConfigError } from "../config/resolve";
import { CONFIG_FILENAME, CONFIG_VERSION } from "../config/schema";
import {
	applyUpgrade,
	type ConfigAnswers,
	type ConfigQuestion,
	type RawConfig,
	upgradeStatus,
} from "../config/upgrade";
import { readLock } from "../lock/lock";
import { PREFIX_PATTERN } from "../registry/prefix";
import { type Output, style } from "../ui/output";

/** Asks the questions an older config is missing answers to. The prompt, unless a test answers instead. */
export type AskConfig = (questions: readonly ConfigQuestion[]) => Promise<ConfigAnswers>;

export type ConfigUpgradeOptions = {
	cwd: string;
	dryRun?: boolean;
	/** `--yes`: take every default, but still record the version. */
	yes?: boolean;
	tests?: boolean;
	/** Never take the defaults on the reader's behalf — what an agent passes, so it can ask the person instead. */
	leaveConfig?: boolean;
};

/** What happened to the config. `pending` names the fields still to be chosen. */
export type ConfigUpgrade =
	| { kind: "current"; version: number }
	| { kind: "newer"; version: number }
	| { kind: "upgraded"; from: number; to: number; answered: ConfigQuestion["key"][] }
	| { kind: "pending"; from: number; to: number; fields: ConfigQuestion["key"][] };

/**
 * Brings `native-components.json` up to `CONFIG_VERSION` before an update reads it.
 *
 * Run first, so an answer — keep tests, say — applies to the same run. At a
 * terminal the new fields are asked about; under `--yes` their defaults are
 * taken and the version recorded; with no one to ask and no `--yes` (a pipe,
 * `--json`, CI) the file is left alone and the run says how to finish it, since
 * recording the version there would mean the questions are never asked at all.
 * A dry run writes nothing, and a config from a newer CLI is never downgraded.
 */
export async function upgradeConfig(
	options: ConfigUpgradeOptions,
	output: Output,
	ask: AskConfig | undefined
): Promise<ConfigUpgrade> {
	const configPath = findConfig(options.cwd);
	if (!configPath) throw new MissingConfigError(options.cwd);

	const raw = JSON.parse(await readFile(configPath, "utf-8")) as RawConfig;
	const lock = await readLock(dirname(configPath));
	const status = upgradeStatus(raw, {
		hasCopiedFiles: Object.keys(lock.items).length > 0,
		testsFlag: options.tests,
	});

	if (status.kind === "current") return { kind: "current", version: CONFIG_VERSION };

	if (status.kind === "newer") {
		output.warn(
			`${style.path(CONFIG_FILENAME)} is version ${status.version}, written by a newer CLI than this one (${CONFIG_VERSION}). Run the latest: ${style.code("delacour@latest update")}.`
		);
		return status;
	}

	const keys = status.questions.map((question) => question.key);
	const fields = keys.map((key) => style.code(key)).join(", ");
	const pending: ConfigUpgrade = { kind: "pending", from: status.from, to: CONFIG_VERSION, fields: keys };

	if (options.dryRun) {
		output.info(
			`${style.path(CONFIG_FILENAME)} is version ${status.from}; an update would bring it to ${CONFIG_VERSION}${fields ? ` and ask about ${fields}` : ""}.`
		);
		return pending;
	}

	if (!ask && (!options.yes || options.leaveConfig) && status.questions.length > 0) {
		output.warn(
			`${style.path(CONFIG_FILENAME)} predates ${fields}. Run ${style.code("delacour update")} at a terminal to choose them, or add ${style.code("--yes")} to keep the defaults.`
		);
		return pending;
	}

	const answers = ask && status.questions.length > 0 ? await ask(status.questions) : {};
	await writeFile(configPath, `${JSON.stringify(applyUpgrade(raw, answers), null, "\t")}\n`, "utf-8");
	output.success(`Brought ${style.path(CONFIG_FILENAME)} up to version ${CONFIG_VERSION}.`);

	return {
		kind: "upgraded",
		from: status.from,
		to: CONFIG_VERSION,
		answered: keys.filter((key) => answers[key] !== undefined),
	};
}

/**
 * The prompt. Escape skips the question it is on, not the upgrade: the version is
 * still recorded, so a skipped field keeps its default and is not asked again.
 */
export async function promptConfig(questions: readonly ConfigQuestion[]): Promise<ConfigAnswers> {
	const answers: ConfigAnswers = {};
	clack.log.info(`${CONFIG_FILENAME} predates ${questions.length === 1 ? "an option" : "some options"} this CLI has.`);

	for (const question of questions) {
		if (question.kind === "confirm") {
			const answer = await clack.confirm({ message: question.message, initialValue: question.initialValue });
			if (!clack.isCancel(answer)) answers[question.key] = answer;
			continue;
		}

		const answer = await clack.text({
			message: question.message,
			placeholder: question.placeholder,
			validate: (value) =>
				!value?.trim() || PREFIX_PATTERN.test(value.trim()) ? undefined : "A PascalCase identifier, like UI or Acme.",
		});
		if (!clack.isCancel(answer) && answer.trim()) answers[question.key] = answer.trim();
	}

	return answers;
}
