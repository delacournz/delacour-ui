import { Children, type ReactNode } from "react";

/**
 * Hands every run of bare text in `children` to `renderRun`, and passes
 * everything else through.
 *
 * React Native cannot render a string outside a `<Text>`, so a compound root
 * that takes `<Badge>New</Badge>` has to wrap the string in its own label part
 * or crash. Consecutive strings and numbers are collected into a single run
 * rather than one each — `{count} left` is one piece of text, and wrapping the
 * parts separately would space them apart by the root's gap.
 *
 * The caller supplies the element, because the label is the one thing that
 * differs between roots: `renderRun` receives the joined text and a key that is
 * unique among the runs.
 *
 * Free of React Native imports, so `bun test` reaches it.
 */
export function wrapTextChildren(
	children: ReactNode,
	renderRun: (text: string, key: string) => ReactNode
): ReactNode[] {
	const output: ReactNode[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		output.push(renderRun(run.join(""), `label-${output.length}`));
		run = [];
	};

	for (const child of Children.toArray(children)) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();
		output.push(child);
	}
	flushRun();

	return output;
}
