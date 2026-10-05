import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "Preview",
	capture: { align: "stretch" },
	caption:
		"The preview draws the subset the toolbar writes on the library's own type scale: three heading levels, bold, italic, strikethrough, code, links, quotes, lists and fenced blocks. A link opens only for http, https, mailto and tel.",
};

const DOCUMENT = [
	"# Field guide",
	"",
	"Pack **light**, walk _early_, and leave ~~nothing~~ no trace.",
	"",
	"> The mountain is not going anywhere.",
	"",
	"1. Check the forecast",
	"2. Tell someone your route",
	"",
	"Run `hut-status` or read the [track notes](https://example.com).",
	"",
	"```",
	"water: 2 L",
	"```",
].join("\n");

export function Demo(): ReactElement {
	return <MarkdownEditor defaultMode="preview" defaultValue={DOCUMENT} rows={6} testID="preview-mode" />;
}
