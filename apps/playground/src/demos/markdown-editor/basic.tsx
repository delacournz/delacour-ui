import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	align: "stretch",
	title: "Basic",
	caption:
		"Select a word and press **B** — it is wrapped and stays selected, so a second press takes it off again. With nothing selected, the markers go in and the caret lands between them. Return on a list line starts the next item.",
	keyboardAware: true,
};

const NOTES = "## Release notes\n\nThe **sheet** now snaps to _named_ points.\n\n- Faster open\n- Calmer close";

export function Demo(): ReactElement {
	return <MarkdownEditor defaultValue={NOTES} placeholder="Write something…" rows={8} testID="basic" />;
}
