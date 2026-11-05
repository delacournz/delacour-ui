import { describe, expect, test } from "bun:test";
import type { RecordedEvent, Telemetry } from "@delacournz/cli-telemetry";
import { Command } from "commander";
import { createTracker, type ProjectFacts } from "./tracker";

class RegistryFetchError extends Error {}

type Fake = {
	telemetry: Telemetry;
	recorded: RecordedEvent[];
	flushes: (number | undefined)[];
	marked: () => number;
};

function fake(options: { enabled?: boolean; showNotice?: boolean } = {}): Fake {
	const recorded: RecordedEvent[] = [];
	const flushes: (number | undefined)[] = [];
	let marks = 0;
	const enabled = options.enabled ?? true;

	const telemetry: Telemetry = {
		enabled,
		reason: enabled ? "default" : "do-not-track",
		noticeText: "NOTICE\n",
		status: () => {
			throw new Error("unused");
		},
		record: (event) => {
			recorded.push(event);
		},
		flush: async (flushOptions) => {
			flushes.push(flushOptions?.timeoutMs);
		},
		enable: () => {},
		disable: () => {},
		shouldShowNotice: () => enabled && (options.showNotice ?? false),
		markNoticeShown: () => {
			marks++;
		},
	};

	return { telemetry, recorded, flushes, marked: () => marks };
}

/** The action command for `argv`, as commander hands it to a `preAction` hook. */
function actionCommand(name: string, argv: string[]): Command {
	let seen: Command | undefined;
	const program = new Command().exitOverride();
	program
		.command(name)
		.argument("[components...]")
		.option("--silent")
		.option("--json")
		.option("--prefix <name>")
		.option("-c, --cwd <path>", "", "/work")
		.option("--registry <url>")
		.action((_components, _options, command: Command) => {
			seen = command;
		});
	program.parse([name, ...argv], { from: "user" });
	if (!seen) throw new Error("action did not run");
	return seen;
}

const FACTS: ProjectFacts = { registry: "official", packageManager: "bun", expoSdk: 54 };

function tracker(f: Fake, writes: string[] = [], facts: ProjectFacts = FACTS) {
	let clock = 1000;
	return createTracker({
		telemetry: f.telemetry,
		stderr: (text) => {
			writes.push(text);
		},
		now: () => {
			clock += 250;
			return clock;
		},
		inspect: async () => facts,
	});
}

describe("a successful command", () => {
	test("records one command event with its outcome and duration, then flushes", async () => {
		const f = fake();
		const t = tracker(f);

		await t.begin(actionCommand("add", ["button", "--prefix", "Acme"]));
		await t.finish({ outcome: "success" });

		expect(f.recorded).toHaveLength(1);
		expect(f.recorded[0]).toEqual({
			name: "command",
			outcome: "success",
			durationMs: 250,
			properties: {
				command: "add",
				flags: ["--prefix"],
				components: ["button"],
				registry: "official",
				packageManager: "bun",
				expoSdk: 54,
			},
		});
		expect(f.flushes).toEqual([1500]);
	});

	test("never carries a flag value or a path", async () => {
		const f = fake();
		const t = tracker(f);

		await t.begin(actionCommand("add", ["button", "--prefix", "SecretCorp", "--cwd", "/Users/me/client"]));
		await t.finish({ outcome: "success" });

		const sent = JSON.stringify(f.recorded);
		expect(sent).not.toContain("SecretCorp");
		expect(sent).not.toContain("/Users/me");
	});

	test("leaves components out for a custom registry", async () => {
		const f = fake();
		const t = tracker(f, [], { registry: "custom", packageManager: "npm", expoSdk: null });

		await t.begin(actionCommand("add", ["secret-client-widget"]));
		await t.finish({ outcome: "success" });

		const properties = f.recorded[0]?.properties ?? {};
		expect("components" in properties).toBe(false);
		expect("expoSdk" in properties).toBe(false);
		expect(properties.registry).toBe("custom");
	});

	test("records a returned exit code without calling it a failure", async () => {
		const f = fake();
		const t = tracker(f);

		await t.begin(actionCommand("update", []));
		await t.finish({ outcome: "success", exitCode: 1 });

		expect(f.recorded[0]?.outcome).toBe("success");
		expect(f.recorded[0]?.properties?.exitCode).toBe(1);
	});
});

describe("a failed command", () => {
	test("records the error's class and never its message", async () => {
		const f = fake();
		const t = tracker(f);

		await t.begin(actionCommand("add", ["button"]));
		await t.finish({ outcome: "error", error: new RegistryFetchError("GET https://private.example/x failed") });

		expect(f.recorded[0]?.outcome).toBe("error");
		expect(f.recorded[0]?.properties?.errorKind).toBe("RegistryFetchError");
		expect(JSON.stringify(f.recorded)).not.toContain("private.example");
	});

	test("records a cancel", async () => {
		const f = fake();
		const t = tracker(f);

		await t.begin(actionCommand("init", []));
		await t.finish({ outcome: "cancelled" });

		expect(f.recorded[0]?.outcome).toBe("cancelled");
		expect(f.flushes).toEqual([1500]);
	});
});

describe("mcp", () => {
	test("records and flushes at the start, because it never returns", async () => {
		const f = fake();
		const t = tracker(f);

		await t.begin(actionCommand("mcp", []));

		expect(f.recorded).toHaveLength(1);
		expect(f.recorded[0]?.properties?.command).toBe("mcp");
		expect(f.flushes).toEqual([1500]);

		await t.finish({ outcome: "success" });

		expect(f.recorded).toHaveLength(1);
		expect(f.flushes).toHaveLength(1);
	});
});

describe("the telemetry command", () => {
	test("is neither noticed nor recorded", async () => {
		const f = fake({ showNotice: true });
		const writes: string[] = [];
		const t = tracker(f, writes);

		await t.begin(actionCommand("telemetry", []));
		await t.finish({ outcome: "success" });

		expect(writes).toEqual([]);
		expect(f.recorded).toEqual([]);
		expect(f.flushes).toEqual([]);
	});
});

describe("when telemetry is off", () => {
	test("records and flushes nothing", async () => {
		const f = fake({ enabled: false });
		const t = tracker(f);

		await t.begin(actionCommand("add", ["button"]));
		await t.finish({ outcome: "success" });

		expect(f.recorded).toEqual([]);
		expect(f.flushes).toEqual([]);
	});
});

describe("the first-run notice", () => {
	test("goes to stderr once and is marked shown", async () => {
		const f = fake({ showNotice: true });
		const writes: string[] = [];
		const t = tracker(f, writes);

		await t.begin(actionCommand("add", ["button"]));

		expect(writes.join("")).toContain("NOTICE");
		expect(f.marked()).toBe(1);
	});

	test("is held back under --silent, and stays unmarked for a later run", async () => {
		const f = fake({ showNotice: true });
		const writes: string[] = [];
		const t = tracker(f, writes);

		await t.begin(actionCommand("add", ["button", "--silent"]));

		expect(writes).toEqual([]);
		expect(f.marked()).toBe(0);
	});

	test("is not shown when it is not due", async () => {
		const f = fake({ showNotice: false });
		const writes: string[] = [];
		const t = tracker(f, writes);

		await t.begin(actionCommand("add", ["button"]));

		expect(writes).toEqual([]);
		expect(f.marked()).toBe(0);
	});
});

describe("a failure inside telemetry", () => {
	test("never reaches the command", async () => {
		const f = fake();
		const t = createTracker({
			telemetry: f.telemetry,
			stderr: () => {},
			inspect: async () => {
				throw new Error("disk on fire");
			},
		});

		await t.begin(actionCommand("add", ["button"]));
		await t.finish({ outcome: "success" });

		expect(f.recorded[0]?.properties?.registry).toBe("official");
	});
});
