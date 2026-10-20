#!/usr/bin/env bun
/**
 * Converts the retired argent capture flows (YAML fragments) into warden e2e
 * specs — one `e2e/previews/<component>.e2e.ts` per component, one `capture()`
 * per captured demo, through the shared helper in `e2e/previews/capture.ts`.
 *
 *     bun scripts/previews/convert-flows.ts --flows <dir> [--only <component>] [--flip]
 *
 * `--flows` is the directory of `<component>/<demo>.yaml` fragments a demo's
 * `meta.capture.flow` names. `--flip` then rewrites each converted demo's
 * `flow: "<path>"` to `flow: true`, which is the spec-era contract: the flow is
 * the demo's own `capture()` block in the component spec.
 *
 * Kept as a script rather than run once and deleted because the component
 * branches still carry a few hundred YAML flows of their own, and the aggregate
 * that merges them runs this again. The mapping is mechanical except for three
 * things, each of which lands in the spec as a `FIXME` comment rather than a
 * guess: a keyboard step with no field to send it to, a step shape this does
 * not know, and anything a human should look at twice.
 */

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { DEMOS_DIR, PLAYGROUND } from "./config";
import { readDemoSource, readGroupOrder } from "./demo-source";

type Target = { id: string } | { text: string } | { matches: string } | { x: number; y: number };

export type ConvertedFlow = {
	/** Statements for the body of the `capture()` callback, unindented. */
	lines: string[];
	/** Whether the flow drives the software keyboard — see `capture()`'s `types` option. */
	types: boolean;
	warnings: string[];
};

type Step = Record<string, unknown>;

type GestureEvent = { type: string; x: number; y: number; delayMs?: number };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function literal(value: string): string {
	return JSON.stringify(value);
}

function num(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** `{ id }`, `{ text }`, `{ text: { matches } }` or `{ x, y }`, as the flows write them. */
function parseTarget(value: unknown): Target | undefined {
	if (!isRecord(value)) return undefined;
	if (typeof value.id === "string") return { id: value.id };
	if (typeof value.text === "string") return { text: value.text };
	if (isRecord(value.text) && typeof value.text.matches === "string") return { matches: value.text.matches };
	const x = num(value.x);
	const y = num(value.y);
	if (x !== undefined && y !== undefined) return { x, y };
	return undefined;
}

function renderTarget(target: Target): string {
	if ("id" in target) return `{ id: ${literal(target.id)} }`;
	if ("text" in target) return `{ text: ${literal(target.text)} }`;
	if ("matches" in target) return `{ matches: ${literal(target.matches)} }`;
	return `{ x: ${target.x}, y: ${target.y} }`;
}

function renderOptions(entries: [string, string | undefined][]): string {
	const present = entries.filter((entry): entry is [string, string] => entry[1] !== undefined);
	return present.length === 0 ? "" : `, { ${present.map(([key, value]) => `${key}: ${value}`).join(", ")} }`;
}

/** The `KeyName` warden spells a key with. */
function keyName(key: string): string | undefined {
	const names: Record<string, string> = {
		"arrow-down": "Down",
		"arrow-left": "Left",
		"arrow-right": "Right",
		"arrow-up": "Up",
		backspace: "Backspace",
		delete: "Delete",
		down: "Down",
		enter: "Enter",
		escape: "Escape",
		left: "Left",
		return: "Enter",
		right: "Right",
		space: "Space",
		tab: "Tab",
		up: "Up",
	};
	return names[key.toLowerCase()];
}

function renderGesture(events: GestureEvent[], interpolate: number | undefined): string[] {
	const lines = ["await f.gesture(", "\t["];
	for (const event of events) {
		const delay = event.delayMs === undefined ? "" : `, delayMs: ${event.delayMs}`;
		lines.push(`\t\t{ type: ${literal(event.type.toLowerCase())}, x: ${event.x}, y: ${event.y}${delay} },`);
	}
	lines.push(interpolate === undefined ? "\t]" : "\t],");
	if (interpolate !== undefined) lines.push(`\t{ interpolate: ${interpolate} }`);
	lines.push(");");
	return lines;
}

/**
 * The converter's state across steps: the field a keyboard step types into is
 * whatever the flow last tapped, and a custom gesture is accumulated until its
 * `Up` so that a scrub split over two argent steps becomes one path.
 */
class Converter {
	// Every handler returns `undefined` rather than `void`, so a branch can end on
	// `return this.fixme(...)` without the linter reading a value into it.
	readonly lines: string[] = [];
	readonly warnings: string[] = [];
	types = false;
	private field: string | undefined;
	private gesture: { events: GestureEvent[]; interpolate: number | undefined } | undefined;
	private pendingKey: { id: string; key: string; times: number } | undefined;

	private emit(...lines: string[]): undefined {
		this.flushKey();
		this.lines.push(...lines);
	}

	private fixme(message: string, step: Step): undefined {
		this.warnings.push(message);
		this.emit(`// FIXME(convert-flows): ${message} — ${JSON.stringify(step)}`);
	}

	/** Consecutive presses of one key become a single `press(id, key, n)`. */
	private flushKey(): undefined {
		const pending = this.pendingKey;
		if (!pending) return;
		this.pendingKey = undefined;
		const times = pending.times === 1 ? "" : `, ${pending.times}`;
		this.lines.push(`await f.press(${literal(pending.id)}, ${literal(pending.key)}${times});`);
	}

	private flushGesture(): undefined {
		const gesture = this.gesture;
		if (!gesture) return;
		this.gesture = undefined;
		this.emit(...renderGesture(gesture.events, gesture.interpolate));
	}

	step(step: Step): undefined {
		const [key] = Object.keys(step).filter((name) => name !== "args");
		if (key === undefined) return this.fixme("empty step", step);
		// An echo between the two halves of a scrub must not split the path.
		if (key !== "tool" && key !== "echo") this.flushGesture();

		switch (key) {
			case "echo":
				return this.emit(`// ${String(step.echo)}`);
			case "wait": {
				const ms = num(step.wait);
				return ms === undefined ? this.fixme("wait without a number", step) : this.emit(`await f.wait(${ms});`);
			}
			case "tap":
				return this.tap(step);
			case "long-press": {
				const value = step["long-press"];
				const target = isRecord(value) ? parseTarget(value.on) : undefined;
				const duration = isRecord(value) ? num(value.duration) : undefined;
				if (!target || !("id" in target)) return this.fixme("long-press needs an id", step);
				this.field = target.id;
				return this.emit(`await f.longPress(${literal(target.id)}${duration === undefined ? "" : `, ${duration}`});`);
			}
			case "swipe":
				return this.swipe(step);
			case "await":
			case "assert":
				return this.expectation(step[key], step);
			case "type": {
				const value = step.type;
				const target = isRecord(value) ? parseTarget(value.into) : undefined;
				if (!target || !("id" in target) || !isRecord(value) || typeof value.text !== "string") {
					return this.fixme("type needs an id and text", step);
				}
				this.types = true;
				this.field = target.id;
				return this.emit(`await f.type(${literal(target.id)}, ${literal(value.text)});`);
			}
			case "tool":
				return this.tool(step);
			default:
				return this.fixme(`unknown step "${key}"`, step);
		}
	}

	private tap(step: Step): undefined {
		const target = parseTarget(step.tap);
		if (!target) return this.fixme("tap needs an id or text", step);
		if ("id" in target) {
			this.field = target.id;
			return this.emit(`await f.tap(${literal(target.id)});`);
		}
		if ("text" in target) return this.emit(`await f.tapText(${literal(target.text)});`);
		if ("x" in target) return this.emit(`await f.tapAt(${target.x}, ${target.y});`);
		return this.fixme("tap by regex is not supported", step);
	}

	private swipe(step: Step): undefined {
		const value = step.swipe;
		if (!isRecord(value)) return this.fixme("swipe needs from and by", step);
		const from = parseTarget(value.from);
		const by = isRecord(value.by) ? value.by : undefined;
		if (!from || !by) return this.fixme("swipe needs from and by", step);
		const dx = num(by.x);
		const dy = num(by.y);
		const vector = [dx === undefined ? null : `x: ${dx}`, dy === undefined ? null : `y: ${dy}`]
			.filter((part): part is string => part !== null)
			.join(", ");
		const options = renderOptions([
			["durationMs", num(value.duration)?.toString()],
			["momentum", value.momentum === false ? "false" : undefined],
		]);
		this.emit(`await f.swipe(${renderTarget(from)}, { ${vector} }${options});`);
	}

	private expectation(value: unknown, step: Step): undefined {
		if (!isRecord(value)) return this.fixme("await needs a condition", step);
		const timeout = renderOptions([["timeout", num(value.timeout)?.toString()]]);
		if (isRecord(value.text) && isRecord(value.text.in) && typeof value.text.contains === "string") {
			const target = parseTarget(value.text.in);
			if (!target || !("id" in target)) return this.fixme("text.in needs an id", step);
			return this.emit(`await f.containsText(${literal(target.id)}, ${literal(value.text.contains)}${timeout});`);
		}
		for (const state of ["visible", "hidden"] as const) {
			if (!(state in value)) continue;
			const target = parseTarget(value[state]);
			if (!target || "x" in target) return this.fixme(`${state} needs an id or text`, step);
			return this.emit(`await f.${state}(${renderTarget(target)}${timeout});`);
		}
		return this.fixme("unknown await condition", step);
	}

	private tool(step: Step): undefined {
		const args = isRecord(step.args) ? step.args : {};
		switch (step.tool) {
			case "keyboard":
				return this.keyboard(args, step);
			case "gesture-tap": {
				const x = num(args.x);
				const y = num(args.y);
				if (x === undefined || y === undefined) return this.fixme("gesture-tap needs x and y", step);
				return this.emit(`await f.tapAt(${x}, ${y});`);
			}
			case "gesture-custom":
				return this.customGesture(args, step);
			default:
				return this.fixme(`unknown tool "${String(step.tool)}"`, step);
		}
	}

	private keyboard(args: Record<string, unknown>, step: Step): undefined {
		this.types = true;
		const field = this.field;
		if (field === undefined) return this.fixme("keyboard step before any field was tapped", step);
		if (typeof args.text === "string") return this.emit(`await f.type(${literal(field)}, ${literal(args.text)});`);
		if (typeof args.key === "string") {
			const key = keyName(args.key);
			if (key === undefined) return this.fixme(`unknown key "${args.key}"`, step);
			if (this.pendingKey && this.pendingKey.id === field && this.pendingKey.key === key) {
				this.pendingKey.times += 1;
				return;
			}
			this.flushKey();
			this.pendingKey = { id: field, key, times: 1 };
			return;
		}
		return this.fixme("keyboard step needs text or key", step);
	}

	private customGesture(args: Record<string, unknown>, step: Step): undefined {
		const events = Array.isArray(args.events) ? args.events : undefined;
		if (!events) return this.fixme("gesture-custom needs events", step);
		const parsed: GestureEvent[] = [];
		for (const event of events) {
			const x = isRecord(event) ? num(event.x) : undefined;
			const y = isRecord(event) ? num(event.y) : undefined;
			if (!isRecord(event) || typeof event.type !== "string" || x === undefined || y === undefined) {
				return this.fixme("gesture-custom event needs type, x and y", step);
			}
			const delayMs = num(event.delayMs);
			parsed.push({ type: event.type, x, y, ...(delayMs === undefined ? {} : { delayMs }) });
		}
		const interpolate = num(args.interpolate);
		if (!this.gesture) {
			this.flushKey();
			this.gesture = { events: [], interpolate };
		}
		this.gesture.events.push(...parsed);
		if (parsed.at(-1)?.type.toLowerCase() === "up") this.flushGesture();
	}

	finish(): ConvertedFlow {
		if (this.gesture) {
			this.warnings.push("gesture path never lifted (no Up event)");
			this.gesture.events.push({ ...(this.gesture.events.at(-1) as GestureEvent), type: "up" });
			this.flushGesture();
		}
		this.flushKey();
		return { lines: this.lines, types: this.types, warnings: this.warnings };
	}
}

/** Converts one YAML fragment's steps into the body of a `capture()` callback. */
export function convertFlow(yaml: string): ConvertedFlow {
	const doc = Bun.YAML.parse(yaml);
	const steps = isRecord(doc) && Array.isArray(doc.steps) ? doc.steps : [];
	const converter = new Converter();
	for (const step of steps) {
		if (isRecord(step)) converter.step(step);
		else converter.warnings.push(`step is not a mapping: ${JSON.stringify(step)}`);
	}
	return converter.finish();
}

export type SpecDemo = { id: string; flow?: ConvertedFlow };

function header(component: string): string {
	return `// ${component} previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

`;
}

/**
 * One spec per component. The order is the barrel's, so the spec reads the way
 * the gallery does; a still is a bare \`capture(id)\` so that every captured
 * demo has a test the orchestrator can select by component.
 */
export function renderSpec(component: string, demos: readonly SpecDemo[]): string {
	const blocks = demos.map((demo) => {
		if (!demo.flow) return `capture(${literal(demo.id)});`;
		const body = demo.flow.lines.map((line) => `\t${line}`).join("\n");
		const options = demo.flow.types ? ", { types: true }" : "";
		return `capture(${literal(demo.id)}${options}, async (f) => {\n${body}\n});`;
	});
	return `${header(component)}${blocks.join("\n\n")}\n`.replace(/\/\/ (.*)/g, (match) => match.replace(/\s+$/, ""));
}

// ---- the script ----

type Options = { flows: string; only?: string; flip: boolean };

function parseArgs(argv: readonly string[]): Options {
	const options: Options = { flip: false, flows: "" };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = (): string => {
			const value = argv[index + 1];
			if (!value) throw new Error(`${arg} needs a value`);
			index += 1;
			return value;
		};
		switch (arg) {
			case "--flows":
				options.flows = next();
				break;
			case "--only":
				options.only = next();
				break;
			case "--flip":
				options.flip = true;
				break;
			default:
				throw new Error(`Unknown flag ${arg}`);
		}
	}
	if (!options.flows) throw new Error("--flows <dir> is required");
	return options;
}

async function walk(dir: string): Promise<string[]> {
	const found: string[] = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) found.push(...(await walk(path)));
		else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) found.push(path);
	}
	return found;
}

/** `flow` as the file has it: a YAML path before conversion, `true` after. The meta type only knows the latter. */
type Found = { id: string; component: string; demo: string; path: string; flow: string | boolean | undefined };

async function findCaptured(only: string | undefined): Promise<Found[]> {
	const found: Found[] = [];
	for (const path of await walk(DEMOS_DIR)) {
		const id = relative(DEMOS_DIR, path).replace(/\.tsx$/, "");
		const component = id.split("/")[0] as string;
		if (only && component !== only) continue;
		const source = await readDemoSource(path);
		if (!source.meta.capture) continue;
		const flow = source.meta.capture.flow as string | boolean | undefined;
		found.push({ component, demo: id.slice(component.length + 1), flow, id, path });
	}
	return found;
}

async function orderByBarrel(demos: Found[]): Promise<Found[]> {
	const orders = new Map<string, string[]>();
	for (const component of new Set(demos.map((demo) => demo.component))) {
		const barrel = join(DEMOS_DIR, component, "index.ts");
		orders.set(component, (await Bun.file(barrel).exists()) ? await readGroupOrder(barrel) : []);
	}
	const rank = (demo: Found): number => {
		const index = orders.get(demo.component)?.indexOf(demo.demo) ?? -1;
		return index === -1 ? Number.MAX_SAFE_INTEGER : index;
	};
	return demos.sort(
		(a, b) => a.component.localeCompare(b.component) || rank(a) - rank(b) || a.demo.localeCompare(b.demo)
	);
}

/** Rewrites `flow: "<path>"` to `flow: true` in a demo whose spec now holds the flow. */
async function flip(path: string, flow: string): Promise<void> {
	const text = await Bun.file(path).text();
	const next = text.replace(new RegExp(`\\bflow:\\s*"${flow.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}"`), "flow: true");
	if (next === text) throw new Error(`${path}: could not find flow: "${flow}" to flip`);
	await Bun.write(path, next);
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const specsDir = join(PLAYGROUND, "e2e/previews");
	const demos = await orderByBarrel(await findCaptured(options.only));

	const byComponent = new Map<string, Found[]>();
	for (const demo of demos) byComponent.set(demo.component, [...(byComponent.get(demo.component) ?? []), demo]);

	let converted = 0;
	let warned = 0;
	for (const [component, group] of byComponent) {
		const specDemos: SpecDemo[] = [];
		for (const demo of group) {
			if (typeof demo.flow !== "string") {
				specDemos.push({ id: demo.id });
				continue;
			}
			const yamlPath = join(options.flows, `${demo.flow}.yaml`);
			if (!(await Bun.file(yamlPath).exists()))
				throw new Error(`${demo.id} names a flow that does not exist: ${yamlPath}`);
			const flow = convertFlow(await Bun.file(yamlPath).text());
			for (const warning of flow.warnings) console.log(`  ! ${demo.id}: ${warning}`);
			warned += flow.warnings.length;
			converted += 1;
			specDemos.push({ flow, id: demo.id });
		}
		const specPath = join(specsDir, `${component}.e2e.ts`);
		await Bun.write(specPath, renderSpec(component, specDemos));
		console.log(`  ✓ ${relative(PLAYGROUND, specPath)}  (${specDemos.length} demos)`);
	}

	if (options.flip) {
		for (const demo of demos) if (typeof demo.flow === "string") await flip(demo.path, demo.flow);
	}

	console.log(`\n  ${byComponent.size} specs · ${converted} flows converted · ${warned} warnings`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
