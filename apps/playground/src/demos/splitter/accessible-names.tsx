import { Splitter } from "@delacour/react-native-ui/splitter";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Accessible names",
	align: "stretch",
	note: 'Each handle is adjustable. A screen reader reads its label and the size of the pane before it — "Resize navigation, 25 percent" — and swipes up or down move it by step. Name which panes a handle divides; the default is a bare "Resize".',
};

export function Demo(): ReactElement {
	return (
		<Splitter
			className="h-48 rounded-lg border border-border border-continuous bg-card overflow-hidden"
			defaultLayout={[25, 50, 25]}
			step={10}
		>
			<Splitter.Pane minSize={10} />
			<Splitter.Handle accessibilityLabel="Resize navigation" testID="handle-0" />
			<Splitter.Pane minSize={20} />
			<Splitter.Handle accessibilityLabel="Resize details" testID="handle-1" />
			<Splitter.Pane minSize={10} />
		</Splitter>
	);
}
