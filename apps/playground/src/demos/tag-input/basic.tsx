import { TagInput } from "@delacour/react-native-ui/tag-input";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Basic",
	caption:
		"Type, then press Return or a comma: the text becomes a chip and the keyboard stays up for the next. Backspace on an empty field arms the last chip, and a second Backspace removes it.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<TagInput defaultValue={["design", "mobile", "typescript"]} placeholder="Add a topic" testID="tag-input-basic" />
	);
}
