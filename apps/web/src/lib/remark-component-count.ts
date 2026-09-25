import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { COMPONENTS } from "./components";
import { numberToWordsCapitalised } from "./number-words";

/**
 * The element `content/docs/native/components/index.mdx` opens with, and what
 * this plugin turns it into: the number of components, spelled — `Twenty`.
 */
export const COMPONENT_COUNT_ELEMENT = "ComponentCount";

/**
 * Replaces every `<ComponentCount />` with the length of `COMPONENTS` as a
 * word, in the MDX tree before anything else reads it.
 *
 * The word was typed into the prose once, and a test pinned it to the list's
 * length; every branch that added a component then edited the same line and
 * the same test, and the two conflicted on merge. Rendering it from the list
 * is what the landing page already does with `COMPONENTS.length`, only as a
 * word, because the sentence opens with it.
 *
 * A remark plugin rather than a registered React component because the docs
 * are read four ways — the page, its `.md` twin, `llms-full.txt` and the
 * search index — and only the page runs React. Fumadocs stringifies the
 * processed markdown after the user's remark plugins, so replacing the node
 * here gives every reader the word; a component would have left agents
 * reading `<ComponentCount /> components`. Wired in `source.config.ts`.
 */
export const remarkComponentCount: Plugin<[], Root> = () => (tree) => {
	const word = numberToWordsCapitalised(COMPONENTS.length);
	visit(tree, (node, index, parent) => {
		if (node.type !== "mdxJsxTextElement" && node.type !== "mdxJsxFlowElement") return;
		if (node.name !== COMPONENT_COUNT_ELEMENT || parent === undefined || index === undefined) return;
		if (node.type === "mdxJsxFlowElement") {
			parent.children.splice(index, 1, { type: "paragraph", children: [{ type: "text", value: word }] });
			return index + 1;
		}
		// Merged into the neighbouring text rather than spliced in beside it:
		// two adjacent text nodes compile to two string children, and React
		// hydrates those with a `<!-- -->` between them.
		const siblings = parent.children;
		const before = siblings[index - 1];
		const after = siblings[index + 1];
		const start = before?.type === "text" ? index - 1 : index;
		const end = after?.type === "text" ? index + 1 : index;
		const value = `${before?.type === "text" ? before.value : ""}${word}${after?.type === "text" ? after.value : ""}`;
		siblings.splice(start, end - start + 1, { type: "text", value });
		return start + 1;
	});
};
