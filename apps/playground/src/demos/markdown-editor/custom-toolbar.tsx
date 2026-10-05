import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "A smaller toolbar",
	caption:
		"`actions` picks the buttons and their order. A comment box rarely needs a heading or a code block, and four buttons fit a phone's row without scrolling.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<MarkdownEditor rows={4}>
			<MarkdownEditor.Toolbar actions={["bold", "italic", "link", "bulletList"]} />
			<MarkdownEditor.Input placeholder="Leave a comment" testID="custom-toolbar" />
			<MarkdownEditor.Preview emptyText="Nothing to preview yet" />
		</MarkdownEditor>
	);
}
