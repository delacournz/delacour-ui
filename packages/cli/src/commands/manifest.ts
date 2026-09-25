import type { Command } from "commander";

/**
 * The command surface, as data, read off the commander program itself.
 *
 * It exists so a test can hold the documentation to it. `commands.mdx` pastes
 * each command's `--help` verbatim precisely because a hand-written table
 * drifts — and a *command* written into prose drifts the same way, more
 * quietly: `init`'s `--package-name` and `--package-path` had already been
 * wrong on the site before anyone noticed.
 *
 * Derived rather than declared, so it cannot disagree with `--help`. Nothing
 * ships this; it is read at test time only.
 */

export type CommandSpec = {
	name: string;
	aliases: string[];
	/** Long flags only — `--install`, `--no-init`. Short ones are unambiguous. */
	flags: string[];
	/** Of those, the ones that consume the next token — `--ref develop`. */
	flagsWithValue: string[];
	/** Whether the command takes positional arguments at all. */
	takesArguments: boolean;
	/** Whether those arguments are variadic — `[components...]`. */
	variadic: boolean;
};

export function commandManifest(program: Command): CommandSpec[] {
	return program.commands.map((command) => {
		const args = command.registeredArguments;

		const options = [...command.options, ...program.options];

		return {
			name: command.name(),
			aliases: command.aliases(),
			flags: [...options.flatMap(longFlags), "--help"].sort(),
			flagsWithValue: options.filter((option) => option.required || option.optional).flatMap(longFlags),
			takesArguments: args.length > 0,
			variadic: args.some((argument) => argument.variadic),
		};
	});
}

/**
 * Both spellings of a `--no-` option.
 *
 * Commander records `--no-install` as one option whose `long` is `--no-install`
 * and whose attribute name is `install`, and both spellings are valid on the
 * command line. A manifest listing only what was declared would fail a document
 * that used the other one.
 */
function longFlags(option: { long?: string | null }): string[] {
	const long = option.long;
	if (!long) return [];

	return long.startsWith("--no-") ? [long, `--${long.slice("--no-".length)}`] : [long, `--no-${long.slice(2)}`];
}
