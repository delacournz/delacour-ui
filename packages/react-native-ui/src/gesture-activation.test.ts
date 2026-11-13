import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const SRC = import.meta.dirname;
const COMPONENTS = join(SRC, "components");

/**
 * Every Gesture Handler tap a screen reader can land on has a way to be
 * activated without a touch.
 *
 * A `Gesture.Tap()` or `Gesture.LongPress()` only ever sees touches. VoiceOver's
 * double-tap reaches it by accident — UIKit synthesises a touch at the
 * element's centre when nothing answers `accessibilityActivate` — and TalkBack's
 * never does: its double-tap performs `ACTION_CLICK`, which React Native routes
 * to `onAccessibilityAction` only when `activate` is listed, and otherwise falls
 * to a `View.performClick` with no listener behind it. A Menu row shipped that
 * way and could not be chosen with TalkBack on.
 *
 * So a component file that builds a tap or a long press in a `GestureDetector`
 * and exposes an element to assistive technology (`accessible`,
 * `accessibilityRole` or `role`) has to take one of the two activation paths:
 *
 * - **`resolvePressableActivation`** — the shared wiring `Pressable` uses:
 *   `onAccessibilityTap` on iOS, an `activate` (and `longpress`) action on
 *   Android, both routed through `dispatchPressableAccessibilityAction`.
 * - **An `activate` action it owns** — listed in `accessibilityActions` (in the
 *   file, or by a resolver in its folder's `*.variants.ts`) and handled in its
 *   own `onAccessibilityAction`, as a `NumberInput` stepper, a `Flow.Node` or a
 *   `ContextMenu.Trigger` does.
 *
 * A file that takes neither is listed in {@link EXEMPT} with the reason its
 * gesture needs no activation path — an `adjustable` whose increment and
 * decrement already do what the tap does, or a tap that is a touch shortcut for
 * an action the element exposes some other way. A reason is required, and an
 * entry for a file that no longer needs one fails, so the list cannot rot.
 *
 * Reading text cannot tell which element an action sits on, so an owned
 * `activate` on an `accessible={false}` container passes here and still reaches
 * nothing — that is checked by each component's render suite and on a device.
 *
 * Like `docs.test.ts`, this reads source as text and imports nothing from the
 * tree — `bun test` cannot parse React Native's Flow-typed source.
 */
const EXEMPT: Record<string, string> = {
	"circular-text/circular-text.tsx":
		"The hold only pauses the ring's turn while a finger rests on it; the text is read whole and nothing is activated. Pausing looping motion for a screen reader is the calm-motion work, not an activation.",
	"image-viewer/image-viewer-layer.tsx":
		"The double-tap zoom is mirrored by the adjustable stage's zoomIn, zoomOut and resetZoom actions, and the single tap only hides chrome that starts visible and stays reachable.",
	"splitter/splitter-handle.tsx":
		"The double-tap reset is the adjustable handle's own reset action (Reset sizes), beside increment, decrement and expand or collapse.",
	"swipe/swipe.tsx":
		"The shield tap only closes a row a finger slid open. A screen reader never opens the row: each revealed tile is one of the row's named accessibility actions.",
};

function componentFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return componentFiles(path);
		return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [path] : [];
	});
}

const TAP = /Gesture\.(Tap|LongPress)\(/;
const EXPOSED = /\baccessible\b(?!\s*=\s*\{\s*false\s*\})|\baccessibilityRole\b|\brole=/;
const SHARED_PATH = /\bresolvePressableActivation\(/;
const OWNED_ACTIVATE = /name:\s*"activate"/;

/** The folder's `*.variants.ts` files, where a resolver may declare the actions a part lists. */
function variantsSource(dir: string): string {
	return readdirSync(dir)
		.filter((name) => name.endsWith(".variants.ts"))
		.map((name) => readFileSync(join(dir, name), "utf-8"))
		.join("\n");
}

/** Whether a file's source wires a screen-reader activation for its tap. */
function hasActivationPath({ source, variants }: { source: string; variants: string }): boolean {
	if (SHARED_PATH.test(source)) return true;
	const listsActivate = OWNED_ACTIVATE.test(source) || OWNED_ACTIVATE.test(variants);
	return listsActivate && source.includes("onAccessibilityAction");
}

const CANDIDATES = componentFiles(COMPONENTS)
	.map((path) => ({
		path: relative(COMPONENTS, path),
		source: readFileSync(path, "utf-8"),
		variants: variantsSource(dirname(path)),
	}))
	.filter(({ source }) => source.includes("GestureDetector") && TAP.test(source) && EXPOSED.test(source));

describe("gesture activation", () => {
	// An empty walk would let every assertion below pass on nothing.
	test("finds the tapping components", () => {
		expect(CANDIDATES.length).toBeGreaterThan(5);
	});

	test("every exposed tap or long press has a screen-reader activation path", () => {
		const offenders = CANDIDATES.filter(
			(candidate) => !(candidate.path in EXEMPT) && !hasActivationPath(candidate)
		).map(({ path }) => path);
		expect(offenders).toEqual([]);
	});

	test("every exemption names a reason", () => {
		const unexplained = Object.entries(EXEMPT)
			.filter(([, reason]) => reason.trim().length < 20)
			.map(([path]) => path);
		expect(unexplained).toEqual([]);
	});

	test("every exemption is still needed", () => {
		const stale = Object.keys(EXEMPT).filter((path) => {
			const candidate = CANDIDATES.find((entry) => entry.path === path);
			return candidate === undefined || hasActivationPath(candidate);
		});
		expect(stale).toEqual([]);
	});
});
