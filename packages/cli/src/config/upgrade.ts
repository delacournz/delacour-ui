import { LIBRARY_PREFIX } from "../registry/prefix";
import { CONFIG_VERSION } from "./schema";

/**
 * Bringing an older `native-components.json` up to the shape this CLI writes.
 *
 * A field added after a project ran `init` is simply absent from its config, and
 * absent usually reads as a default nobody chose. `version` records which shape
 * the project was last brought up to, so `update` can ask about exactly the
 * fields that arrived since — once — and then record the new version whether or
 * not each question was answered. Declining is an answer; asking again on every
 * run would be noise.
 *
 * Pure: raw JSON in, questions or raw JSON out. `commands/config-upgrade.ts` is
 * the I/O and the prompts around it.
 */

export type RawConfig = Record<string, unknown>;

export type ConfigQuestion =
	| { key: "tests.enabled"; kind: "confirm"; message: string; initialValue: boolean }
	| { key: "prefix"; kind: "text"; message: string; placeholder: string };

export type ConfigQuestionKey = ConfigQuestion["key"];

/** What the reader answered. A key left out was skipped, and nothing is written for it. */
export type ConfigAnswers = { "tests.enabled"?: boolean; prefix?: string };

export type UpgradeContext = {
	/** Whether the lock records any copied file — renaming the prefix then would read as an edit to every one. */
	hasCopiedFiles: boolean;
	/** `--tests` / `--no-tests` on this run, which already answers and saves `tests.enabled`. */
	testsFlag?: boolean;
};

export type UpgradeStatus =
	| { kind: "current" }
	/** A later CLI wrote it; this one leaves it alone and says so. */
	| { kind: "newer"; version: number }
	| { kind: "outdated"; from: number; questions: ConfigQuestion[] };

type ConfigField = {
	/** The config version that introduced the question. */
	since: number;
	present(raw: RawConfig): boolean;
	question(context: UpgradeContext): ConfigQuestion | null;
};

const FIELDS: readonly ConfigField[] = [
	{
		since: 2,
		present: (raw) => isRecord(raw.tests) && typeof raw.tests.enabled === "boolean",
		question: (context) =>
			context.testsFlag === undefined
				? {
						key: "tests.enabled",
						kind: "confirm",
						message: "Also keep each component's tests in step with the registry?",
						initialValue: false,
					}
				: null,
	},
	{
		since: 2,
		present: (raw) => typeof raw.prefix === "string",
		// Every copied file was hashed under the old name, so renaming now reads as an edit to all of them.
		question: (context) =>
			context.hasCopiedFiles
				? null
				: {
						key: "prefix",
						kind: "text",
						message: `What should components call the library, in place of ${LIBRARY_PREFIX}? Leave empty to keep it.`,
						placeholder: "UI",
					},
	},
];

export function configVersion(raw: RawConfig): number {
	return typeof raw.version === "number" ? raw.version : 1;
}

export function upgradeStatus(raw: RawConfig, context: UpgradeContext): UpgradeStatus {
	const from = configVersion(raw);
	if (from > CONFIG_VERSION) return { kind: "newer", version: from };
	if (from === CONFIG_VERSION) return { kind: "current" };

	const questions = FIELDS.filter((field) => field.since > from && !field.present(raw)).flatMap((field) => {
		const question = field.question(context);
		return question ? [question] : [];
	});

	return { kind: "outdated", from, questions };
}

/** The config with the answers recorded and `version` set, every other key kept and `version` after `$schema`. */
export function applyUpgrade(raw: RawConfig, answers: ConfigAnswers): RawConfig {
	const { $schema, version: _version, ...rest } = raw;
	const next: RawConfig = { ...($schema === undefined ? {} : { $schema }), version: CONFIG_VERSION, ...rest };

	if (answers["tests.enabled"] !== undefined) {
		next.tests = { ...(isRecord(raw.tests) ? raw.tests : {}), enabled: answers["tests.enabled"] };
	}
	if (answers.prefix) next.prefix = answers.prefix;

	return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
