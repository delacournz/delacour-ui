import { Tree } from "@delacour/react-native-ui/tree";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Guide lines",
	caption: "`hasLines` draws a hairline down every open group, under its branch's chevron, so depth reads at a glance.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<Tree defaultExpanded={["guide", "guide/start", "reference"]} hasLines>
			<Tree.Item value="guide">
				<Tree.Trigger>Guide</Tree.Trigger>
				<Tree.Group>
					<Tree.Item value="guide/start">
						<Tree.Trigger>Getting started</Tree.Trigger>
						<Tree.Group>
							<Tree.Item value="guide/start/install">
								<Tree.Trigger>Installation</Tree.Trigger>
							</Tree.Item>
							<Tree.Item value="guide/start/theme">
								<Tree.Trigger>Theming</Tree.Trigger>
							</Tree.Item>
						</Tree.Group>
					</Tree.Item>
					<Tree.Item value="guide/motion">
						<Tree.Trigger>Motion</Tree.Trigger>
					</Tree.Item>
				</Tree.Group>
			</Tree.Item>
			<Tree.Item value="reference">
				<Tree.Trigger>Reference</Tree.Trigger>
				<Tree.Group>
					<Tree.Item value="reference/components">
						<Tree.Trigger>Components</Tree.Trigger>
					</Tree.Item>
					<Tree.Item value="reference/hooks">
						<Tree.Trigger>Hooks</Tree.Trigger>
					</Tree.Item>
				</Tree.Group>
			</Tree.Item>
		</Tree>
	);
}
