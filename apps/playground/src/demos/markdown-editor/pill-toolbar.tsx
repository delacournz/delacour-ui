import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "Pill toolbar",
	caption:
		'`variant="pill"` floats the actions in a capsule above the field instead of sitting on its top edge. `secondary` fills the field and the preview rather than outlining them.',
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<MarkdownEditor defaultValue="A _quieter_ toolbar." rows={4} variant="secondary">
			<MarkdownEditor.Toolbar actions={["heading", "bold", "italic", "quote", "orderedList"]} variant="pill" />
			<MarkdownEditor.Input testID="pill-toolbar" />
			<MarkdownEditor.Preview />
		</MarkdownEditor>
	);
}
