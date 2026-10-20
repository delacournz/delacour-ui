/**
 * Reads a component's preview spec as text: the `capture("<id>", …)` block for
 * each demo, which is the part of the spec that is *that demo's* flow and so
 * belongs in its source hash.
 *
 * The AST rather than a regex, because a flow body holds strings and comments
 * that can contain anything, and the block ends at the matching parenthesis,
 * not at the next blank line.
 */

import { join } from "node:path";
import ts from "typescript";
import { SPECS_DIR } from "./config";

export type CaptureBlock = {
	id: string;
	/** The whole call expression, verbatim. */
	text: string;
	/** Whether it has a flow body — a clip — rather than being a bare still. */
	animated: boolean;
};

/** `e2e/previews/<component>.e2e.ts`. */
export function specPath(component: string): string {
	return join(SPECS_DIR, `${component}.e2e.ts`);
}

/** Every `capture()` call in a spec's source, in file order. */
export function captureBlocks(source: string, path = "spec.e2e.ts"): CaptureBlock[] {
	const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const blocks: CaptureBlock[] = [];

	const visit = (node: ts.Node): void => {
		if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "capture") {
			const [first, ...rest] = node.arguments;
			if (first && ts.isStringLiteral(first)) {
				blocks.push({
					animated: rest.some((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)),
					id: first.text,
					text: node.getText(file),
				});
			}
		}
		ts.forEachChild(node, visit);
	};

	visit(file);
	return blocks;
}

const cache = new Map<string, Promise<Map<string, CaptureBlock>>>();

/** The blocks of one component's spec, keyed by demo id; empty when the spec does not exist. */
export function readSpecBlocks(component: string): Promise<Map<string, CaptureBlock>> {
	let pending = cache.get(component);
	if (!pending) {
		pending = (async () => {
			const path = specPath(component);
			const file = Bun.file(path);
			if (!(await file.exists())) return new Map();
			return new Map(captureBlocks(await file.text(), path).map((block) => [block.id, block]));
		})();
		cache.set(component, pending);
	}
	return pending;
}
