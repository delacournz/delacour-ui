import { Button } from "@delacour/react-native-ui/button";
import { MarkdownEditor, type MarkdownMode } from "@delacour/react-native-ui/markdown-editor";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled mode",
	caption:
		"`mode` and `onModeChange` put the pane in the caller's hands — here a button outside the editor flips it, and the toolbar's own switch keeps working beside it.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [mode, setMode] = useState<MarkdownMode>("write");

	return (
		<View className="gap-3">
			<MarkdownEditor defaultValue="**Ready** to check?" mode={mode} onModeChange={setMode} rows={4} />
			<Button
				onPress={() => setMode(mode === "write" ? "preview" : "write")}
				testID="controlled-mode-toggle"
				variant="secondary"
			>
				<Button.Label>{mode === "write" ? "Show preview" : "Back to writing"}</Button.Label>
			</Button>
		</View>
	);
}
