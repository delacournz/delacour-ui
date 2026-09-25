import { Badge } from "@delacour/react-native-ui/badge";
import { Button } from "@delacour/react-native-ui/button";
import { Card } from "@delacour/react-native-ui/card";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Anatomy",
	caption:
		"A header with a title, a description and an action pinned to its corner, a body, and a footer of actions. The parts carry the padding, so the card itself needs none.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	const [exports, setExports] = useState(0);

	return (
		<Card testID="card-anatomy">
			<Card.Header>
				<Card.Title>Monthly report</Card.Title>
				<Card.Description>Revenue and retention for October.</Card.Description>
				<Card.Action>
					<Badge color="success" size="sm" variant="soft">
						+12%
					</Badge>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<Text.Title>$48,120</Text.Title>
				<Text.Caption testID="card-anatomy-exports">
					{exports === 0 ? "Not exported yet" : `Exported ${exports} ${exports === 1 ? "time" : "times"}`}
				</Text.Caption>
			</Card.Content>
			<Card.Footer className="justify-end">
				<Button
					onPress={() => setExports((count) => count + 1)}
					size="sm"
					testID="card-anatomy-export"
					variant="outline"
				>
					Export
				</Button>
				<Button size="sm" testID="card-anatomy-open">
					Open
				</Button>
			</Card.Footer>
		</Card>
	);
}
